from django.db import models

from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel

PRIORITY_CHOICES = [
    ("low", "منخفضة"),
    ("normal", "عادية"),
    ("high", "عالية"),
]

STATUS_CHOICES = [
    ("open", "مفتوحة"),
    ("in_progress", "قيد التنفيذ"),
    ("done", "منجزة"),
]


class MemberTask(BaseModel):
    member = models.ForeignKey("members.Member", on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_tasks"
    )
    assigned_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    due_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="normal")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open", db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["status", "due_date", "-created_at"]
        verbose_name = "Member Task"
        verbose_name_plural = "Member Tasks"

    def __str__(self):
        return f"{self.member} — {self.title}"
