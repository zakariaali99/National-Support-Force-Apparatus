from django.test import TestCase

from rest_framework.test import APIClient

from apps.core.models import Role, User
from apps.organization.models import DocumentType, Faction, Rank


class RankApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.plain_user = User.objects.create_user(username="plain", password="x")
        self.manager_role = Role.objects.create(
            name="org-manager", name_ar="مدير تنظيم", permissions=["organization.manage"]
        )
        self.manager_user = User.objects.create_user(username="manager", password="x")
        self.manager_user.roles.add(self.manager_role)

    def test_any_authenticated_user_can_read(self):
        Rank.objects.create(code="captain", name_ar="نقيب", order=1)
        self.client.force_authenticate(self.plain_user)

        response = self.client.get("/api/ranks/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.get("/api/ranks/")
        self.assertEqual(response.status_code, 401)

    def test_write_requires_organization_manage_permission(self):
        self.client.force_authenticate(self.plain_user)

        response = self.client.post("/api/ranks/", {"code": "major", "name_ar": "رائد"})

        self.assertEqual(response.status_code, 403)
        self.assertFalse(Rank.objects.filter(code="major").exists())

    def test_user_with_organization_manage_can_write(self):
        self.client.force_authenticate(self.manager_user)

        response = self.client.post("/api/ranks/", {"code": "major", "name_ar": "رائد"})

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Rank.objects.filter(code="major").exists())

    def test_delete_soft_deletes_not_hard_deletes(self):
        rank = Rank.objects.create(code="colonel", name_ar="عقيد")
        self.client.force_authenticate(self.manager_user)

        response = self.client.delete(f"/api/ranks/{rank.id}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Rank.objects.filter(pk=rank.pk).exists())
        self.assertTrue(Rank.all_objects.filter(pk=rank.pk).exists())


class FactionApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        role = Role.objects.create(
            name="org-manager2", name_ar="مدير تنظيم", permissions=["organization.manage"]
        )
        self.manager_user = User.objects.create_user(username="manager2", password="x")
        self.manager_user.roles.add(role)
        self.client.force_authenticate(self.manager_user)

    def test_create_and_list_faction(self):
        response = self.client.post(
            "/api/factions/", {"code": "eastern-unit", "name_ar": "الوحدة الشرقية"}
        )
        self.assertEqual(response.status_code, 201)

        listed = self.client.get("/api/factions/")
        self.assertEqual(listed.data["count"], 1)


class DocumentTypeApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        role = Role.objects.create(
            name="org-manager3", name_ar="مدير تنظيم", permissions=["organization.manage"]
        )
        self.manager_user = User.objects.create_user(username="manager3", password="x")
        self.manager_user.roles.add(role)
        self.client.force_authenticate(self.manager_user)
        # "passport" is seeded as a system type by the
        # organization.0002_seed_document_types data migration, which also
        # runs against the test database — reuse it rather than creating a
        # duplicate (code is unique).
        self.system_type = DocumentType.objects.get(code="passport")

    def test_system_document_type_cannot_be_deleted(self):
        response = self.client.delete(f"/api/document-types/{self.system_type.id}/")

        self.assertEqual(response.status_code, 403)
        self.assertTrue(DocumentType.objects.filter(pk=self.system_type.pk).exists())

    def test_system_document_type_code_cannot_be_renamed(self):
        response = self.client.patch(
            f"/api/document-types/{self.system_type.id}/", {"code": "renamed"}
        )

        self.assertEqual(response.status_code, 400)

    def test_non_system_document_type_can_be_deleted(self):
        custom = DocumentType.objects.create(code="driving_licence", name_ar="رخصة القيادة")

        response = self.client.delete(f"/api/document-types/{custom.id}/")

        self.assertEqual(response.status_code, 204)
