"""Regression tests for apps.core.models.base.BaseModel.

Two bugs fixed here:

1. `_base_manager` trap: BaseModel declared `objects = SoftDeleteManager()`
   first, which Django implicitly uses as `_base_manager` — the manager
   used internally for FK/related-object lookups. That meant traversing a
   FK to a soft-deleted row raised DoesNotExist everywhere (admin,
   serializers, PDF rendering), not just in code that explicitly filtered
   for deleted rows. Fixed via Meta.base_manager_name = "all_objects".

2. `soft_delete()`/`restore()` used a full `save()`, which clobbers
   concurrent edits to unrelated fields and writes a full history row
   instead of a minimal one. Fixed via `save(update_fields=[...])`.

Uses two dynamically-created BaseModel subclasses (a Parent and a Child
with a FK to it) since no concrete BaseModel subclass exists in the
codebase yet — that starts with apps.organization/apps.members in later
phases. Tables are created directly via the schema editor for the
duration of this test module only.
"""

from django.db import connection, models
from django.test import TestCase

from apps.core.models.base import BaseModel


class SoftDeleteTestParent(BaseModel):
    name = models.CharField(max_length=50)

    class Meta:
        app_label = "core"


class SoftDeleteTestChild(BaseModel):
    parent = models.ForeignKey(SoftDeleteTestParent, on_delete=models.CASCADE, related_name="children")

    class Meta:
        app_label = "core"


class SoftDeleteBaseModelTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        with connection.schema_editor() as editor:
            editor.create_model(SoftDeleteTestParent)
            editor.create_model(SoftDeleteTestChild)

    @classmethod
    def tearDownClass(cls):
        with connection.schema_editor() as editor:
            editor.delete_model(SoftDeleteTestChild)
            editor.delete_model(SoftDeleteTestParent)
        super().tearDownClass()

    def test_default_manager_hides_soft_deleted_rows(self):
        obj = SoftDeleteTestParent.objects.create(name="hidden after delete")
        obj.soft_delete()

        self.assertFalse(SoftDeleteTestParent.objects.filter(pk=obj.pk).exists())
        self.assertTrue(SoftDeleteTestParent.all_objects.filter(pk=obj.pk).exists())

    def test_restore_makes_it_visible_again(self):
        obj = SoftDeleteTestParent.objects.create(name="round trip")
        obj.soft_delete()
        obj.restore()

        self.assertTrue(SoftDeleteTestParent.objects.filter(pk=obj.pk).exists())
        self.assertIsNone(SoftDeleteTestParent.all_objects.get(pk=obj.pk).deleted_at)

    def test_fk_traversal_survives_soft_delete_of_the_related_row(self):
        """The actual bug: without base_manager_name="all_objects", this
        raises SoftDeleteTestParent.DoesNotExist even though the row is still
        physically present — because Django's FK descriptor resolves the
        related object through `_base_manager`, which defaulted to the
        soft-delete-filtered `objects` manager.
        """
        parent = SoftDeleteTestParent.objects.create(name="parent")
        child = SoftDeleteTestChild.objects.create(parent=parent)
        parent.soft_delete()

        child.refresh_from_db()
        # Must not raise SoftDeleteTestParent.DoesNotExist.
        self.assertEqual(child.parent_id, parent.pk)
        self.assertEqual(child.parent.name, "parent")

    def test_soft_delete_only_touches_the_fields_it_declares(self):
        obj = SoftDeleteTestParent.objects.create(name="original")
        # Simulate a concurrent edit made after this instance was loaded.
        SoftDeleteTestParent.all_objects.filter(pk=obj.pk).update(name="edited concurrently")

        obj.soft_delete()

        reloaded = SoftDeleteTestParent.all_objects.get(pk=obj.pk)
        self.assertTrue(reloaded.is_deleted)
        # A full save() would have overwritten this back to "original".
        self.assertEqual(reloaded.name, "edited concurrently")
