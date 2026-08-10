from django.core.cache import cache
from django.db import models
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

FIELD_REQUIREMENTS_CACHE_KEY = "member_field_requirements:v1"


class FieldRequirement(models.Model):
    """Mutable is_required/is_visible/order override for a Member field
    named in apps.members.field_registry.FIELD_REGISTRY (the source of
    truth for which fields exist). Rows are created by
    sync_field_requirements / the seeding migration — never via a plain
    POST (see FieldRequirementViewSet, create/destroy aren't exposed).
    """

    field_key = models.SlugField(max_length=100, unique=True)
    is_required = models.BooleanField(default=False)
    is_visible = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "field_key"]
        verbose_name = "Field Requirement"
        verbose_name_plural = "Field Requirements"

    def __str__(self):
        return self.field_key


@receiver(post_save, sender=FieldRequirement)
@receiver(post_delete, sender=FieldRequirement)
def _clear_field_requirements_cache(sender, **kwargs):
    # Covers every write path (API, admin, shell, sync command) — the API
    # list endpoint reads through this same key rather than caching in the
    # view alone, which would miss non-API writes.
    cache.delete(FIELD_REQUIREMENTS_CACHE_KEY)
