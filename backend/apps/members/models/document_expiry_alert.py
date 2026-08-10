from django.db import models


class DocumentExpiryAlert(models.Model):
    """One row per (document, expiry date) alert already sent — the
    uniqueness constraint is what makes check_document_expiry idempotent:
    running it twice in a day (or after a cron misfire) never double
    -notifies. If a document's expiry_date changes, a new alert can fire
    for the new date since it's part of the unique key.
    """

    document = models.ForeignKey(
        "members.MemberDocument", on_delete=models.CASCADE, related_name="expiry_alerts"
    )
    expiry_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["document", "expiry_date"], name="uniq_expiry_alert_per_date")
        ]
        verbose_name = "Document Expiry Alert"
        verbose_name_plural = "Document Expiry Alerts"

    def __str__(self):
        return f"{self.document} — {self.expiry_date}"
