from django.db import models


class ScheduledJobRun(models.Model):
    """One row per execution of a cron-driven management command
    (check_document_expiry, accrue_vacation, backup_db, ...). Two jobs:

    1. Idempotency — a command that shouldn't run twice for the same
       period (e.g. accrue_vacation for "2026-08") can
       get_or_create(name=..., period_key=...) and skip if a successful
       run already exists, instead of tracking its own ad-hoc marker.
    2. Dead-cron detection — if cron silently stops firing, there's no
       error anywhere to see; querying the latest ScheduledJobRun per
       `name` and comparing `finished_at` against how often it's supposed
       to run is what surfaces that (see the Backups/Audit frontend page).
    """

    name = models.CharField(max_length=100, db_index=True)
    period_key = models.CharField(max_length=20, blank=True)  # e.g. "2026-08-10" or "2026-08"
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    success = models.BooleanField(null=True)  # NULL while still running
    detail = models.TextField(blank=True)

    class Meta:
        ordering = ["-started_at"]
        constraints = [
            models.UniqueConstraint(fields=["name", "period_key"], name="uniq_job_run_per_period")
        ]
        verbose_name = "Scheduled Job Run"
        verbose_name_plural = "Scheduled Job Runs"

    def __str__(self):
        return f"{self.name} ({self.period_key}) — {'ok' if self.success else 'failed' if self.success is False else 'running'}"

    def mark_success(self, detail=""):
        from django.utils import timezone

        self.success = True
        self.finished_at = timezone.now()
        self.detail = detail
        self.save(update_fields=["success", "finished_at", "detail"])

    def mark_failure(self, detail=""):
        from django.utils import timezone

        self.success = False
        self.finished_at = timezone.now()
        self.detail = detail
        self.save(update_fields=["success", "finished_at", "detail"])
