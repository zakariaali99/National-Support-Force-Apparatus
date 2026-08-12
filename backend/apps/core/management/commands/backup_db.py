import hashlib
import io
import os
import subprocess
from datetime import date

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from apps.core.backup_crypto import encrypt_bytes
from apps.core.models import BackupRecord, ScheduledJobRun


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Force backup even if already run today")

    def handle(self, *args, **options):
        force = options.get("force", False)
        period_key = date.today().isoformat()
        job, created = ScheduledJobRun.objects.get_or_create(name="backup_db", period_key=period_key)
        if not force and not created and job.success:
            self.stdout.write(self.style.WARNING(f"backup_db already ran successfully for {period_key}; skipping."))
            return

        db = connection.settings_dict
        try:
            if connection.vendor == "sqlite":
                dump = self._run_sqlite_dump()
            elif connection.vendor == "postgresql":
                dump = self._run_pg_dump(db)
            else:
                dump = self._run_sqlite_dump()

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

    def _run_sqlite_dump(self):
        buf = io.StringIO()
        call_command(
            "dumpdata",
            "core.User",
            "core.Role",
            "core.ActivityLog",
            "core.BackupRecord",
            "organization",
            "members",
            "workflow",
            exclude=["contenttypes", "auth.permission"],
            natural_foreign=True,
            natural_primary=True,
            indent=2,
            stdout=buf,
        )
        return buf.getvalue().encode("utf-8")

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
        env = dict(os.environ)
        if db.get("PASSWORD"):
            env["PGPASSWORD"] = db["PASSWORD"]

        result = subprocess.run(cmd, capture_output=True, env=env, check=False)
        if result.returncode != 0:
            raise CommandError(f"pg_dump failed: {result.stderr.decode(errors='replace')}")
        return result.stdout
