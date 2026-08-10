from django.db import models


class ActivityLog(models.Model):
    """Append-only audit trail for actions that HistoricalRecords can't
    see — reads, not writes: "who viewed/downloaded whose passport", who
    printed or exported a list, failed login attempts. Field-level writes
    on Member/MemberDocument/Rank/Faction/DocumentType are already captured
    by HistoricalRecords (Phase 1/2) and browsable via
    apps.core.views.audit.HistoryView — this model is deliberately not for
    that.

    Not a BaseModel subclass: an audit log has no soft-delete and no
    update/delete API — see apps.core.views.audit.ActivityLogViewSet
    (ListModelMixin only).
    """

    actor = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    # Snapshot at write time — survives the actor being deactivated or
    # deleted, so an old log entry still reads "أحمد قام بـ..." instead of
    # going blank.
    actor_username = models.CharField(max_length=150, blank=True)
    action = models.CharField(max_length=50, db_index=True)
    target_model = models.CharField(max_length=50, blank=True)
    target_id = models.CharField(max_length=50, blank=True)
    description = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Activity Log"
        verbose_name_plural = "Activity Log"

    def __str__(self):
        return f"{self.actor_username or 'system'} — {self.action}"
