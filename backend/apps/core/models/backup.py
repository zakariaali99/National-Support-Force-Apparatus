from django.db import models


class BackupRecord(models.Model):
    """One row per encrypted database backup written by the backup_db
    command (see apps.core.management.commands.backup_db). `file_path`
    points outside MEDIA_ROOT/PRIVATE_MEDIA_ROOT — see settings.BACKUP_ROOT
    — so a compromised media path can't reach the backups. Downloads go
    through a dedicated, permission-gated, logged endpoint (backup.download,
    see apps.core.views.audit.BackupDownloadView), never a static file URL.
    """

    file_path = models.CharField(max_length=500)
    file_size = models.PositiveBigIntegerField()
    sha256 = models.CharField(max_length=64)
    encrypted = models.BooleanField(default=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Backup Record"
        verbose_name_plural = "Backup Records"

    def __str__(self):
        return f"{self.created_at:%Y-%m-%d %H:%M} ({self.file_size} bytes)"
