import hashlib
import subprocess
from datetime import date

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from apps.core.backup_crypto import encrypt_bytes
from apps.core.models import BackupRecord, ScheduledJobRun


class Command(BaseCommand):
    help = "Dump the database with pg_dump, encrypt it, and record a BackupRecord. Postgres-only."

    def handle(self, *args, **options):
        if connection.vendor != "postgresql":
            raise CommandError("backup_db only supports the postgresql engine.")

        period_key = date.today().isoformat()
        job, created = ScheduledJobRun.objects.get_or_create(name="backup_db", period_key=period_key)
        if not created and job.success:
            self.stdout.write(self.style.WARNING(f"backup_db already ran successfully for {period_key}; skipping."))
            return

        db = connection.settings_dict
        try:
            dump = self._run_pg_dump(db)
            encrypted = encrypt_bytes(dump)

            settings.BACKUP_ROOT.mkdir(parents=True, exist_ok=True)
            filename = f"nsfa-backup-{date.today().isoformat()}-{job.id}.sql.enc"
            file_path = settings.BACKUP_ROOT / filename
            file_path.write_bytes(encrypted)

            record = BackupRecord.objects.create(
                file_path=str(file_path),
                file_size=len(encrypted),
                sha256=hashlib.sha256(encrypted).hexdigest(),
                encrypted=True,
            )
            job.mark_success(detail=f"BackupRecord #{record.id}, {len(encrypted)} bytes")
            self.stdout.write(self.style.SUCCESS(f"Backup written: {file_path} ({len(encrypted)} bytes)"))
        except Exception as exc:
            job.mark_failure(detail=str(exc))
            raise

    def _run_pg_dump(self, db):
        cmd = [
            "pg_dump",
            "--no-owner",
            "--no-privileges",
            "-h", db.get("HOST") or "localhost",
            "-p", str(db.get("PORT") or 5432),
            "-U", db.get("USER") or "",
            db.get("NAME"),
        ]
        env = {}
        import os

        env.update(os.environ)
        if db.get("PASSWORD"):
            env["PGPASSWORD"] = db["PASSWORD"]

        result = subprocess.run(cmd, capture_output=True, env=env, check=False)
        if result.returncode != 0:
            raise CommandError(f"pg_dump failed: {result.stderr.decode(errors='replace')}")
        return result.stdout
