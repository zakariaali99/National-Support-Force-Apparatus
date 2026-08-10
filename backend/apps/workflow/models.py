from django.db import models


class Notification(models.Model):
    """In-app notification, polled by the frontend (no websockets — see
    PLAN.md's "Notifications: in-app only for v1" decision). Not a
    BaseModel subclass: notifications aren't soft-deletable business
    records — read state is tracked with is_read, and there's no delete
    API. target_model/target_object_id is a loose generic reference
    (mirrors the ActivityLog approach planned for Phase 7) so this model
    doesn't need a migration every time a new notification-triggering
    action is added (task assignment now; approval workflow in Phase 6).
    """

    recipient = models.ForeignKey(
        "core.User", on_delete=models.CASCADE, related_name="notifications"
    )
    verb = models.CharField(max_length=50)  # e.g. "task_assigned"
    message = models.CharField(max_length=255)
    target_model = models.CharField(max_length=50, blank=True)  # e.g. "MemberTask"
    target_object_id = models.PositiveIntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"{self.recipient} — {self.verb}"
