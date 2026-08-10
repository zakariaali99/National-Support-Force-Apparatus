from django.db import models

from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel


class Rank(BaseModel):
    """A rank (رتبة) a member can hold. Maintained by the user in Settings —
    not a hardcoded enum, since the set of ranks differs by organization and
    changes over time.
    """

    code = models.SlugField(max_length=50, unique=True)
    name_ar = models.CharField(max_length=100)
    # Determines display/sort order (e.g. in dropdowns, printed ID cards) —
    # independent of insertion order or alphabetical Arabic sort.
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["order", "name_ar"]
        verbose_name = "Rank"
        verbose_name_plural = "Ranks"

    def __str__(self):
        return self.name_ar
