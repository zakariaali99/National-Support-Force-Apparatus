from django.db import models

from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel


class Faction(BaseModel):
    """A department/unit (referred to as a "faction" per the user's
    terminology) a member belongs to. Maintained by the user in Settings.
    """

    code = models.SlugField(max_length=50, unique=True)
    name_ar = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["name_ar"]
        verbose_name = "Faction"
        verbose_name_plural = "Factions"

    def __str__(self):
        return self.name_ar
