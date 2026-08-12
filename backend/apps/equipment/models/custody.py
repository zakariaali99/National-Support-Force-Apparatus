from django.db import models
from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel


CUSTODY_ACTION_CHOICES = [
    ("assigned", "تسليم عهدة"),
    ("returned", "إرجاع عهدة"),
    ("maintenance", "إحالة للصيانة"),
]


class CustodyRecord(BaseModel):
    """Custody transaction log for tracking weapons & ammunition assigned to personnel."""

    item = models.ForeignKey("equipment.InventoryItem", on_delete=models.CASCADE, related_name="custody_records")
    member = models.ForeignKey("members.Member", null=True, blank=True, on_delete=models.SET_NULL, related_name="custody_history")
    faction = models.ForeignKey("organization.Faction", null=True, blank=True, on_delete=models.SET_NULL, related_name="custody_history")
    action = models.CharField(max_length=20, choices=CUSTODY_ACTION_CHOICES, default="assigned")
    quantity = models.PositiveIntegerField(default=1)
    assigned_date = models.DateField(auto_now_add=True)
    return_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    issued_by = models.ForeignKey("core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "سجل حركة العهدة"
        verbose_name_plural = "سجلات حركة العهدة"

    def __str__(self):
        return f"{self.item} — {self.get_action_display()}"
