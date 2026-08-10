from django.db import models
from django.utils import timezone


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class AllObjectsManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset()


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True
        # Without this, Django's implicit `_base_manager` defaults to the
        # first declared manager (`objects`, the soft-delete-filtered one).
        # `_base_manager` is what FK/related lookups and `refresh_from_db`
        # use internally, so a soft-deleted row would make every relation
        # pointing at it raise DoesNotExist. `all_objects` must be the base
        # manager; `objects` stays the default for everyday queries.
        base_manager_name = "all_objects"
        default_manager_name = "objects"

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])