from django.db import models

from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel


class MemberNote(BaseModel):
    member = models.ForeignKey("members.Member", on_delete=models.CASCADE, related_name="notes")
    body = models.TextField()
    is_pinned = models.BooleanField(default=False)
    author = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["-is_pinned", "-created_at"]
        verbose_name = "Member Note"
        verbose_name_plural = "Member Notes"

    def __str__(self):
        return f"{self.member} — {self.body[:30]}"
