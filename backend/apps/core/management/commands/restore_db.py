import os
import subprocess
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from apps.core.backup_crypto import decrypt_bytes


class Command(BaseCommand):
    help = (
        "DESTRUCTIVE: restores the database from an encrypted backup file, "
        "overwriting all current data. Requires --yes. Postgres-only."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            help=(
                "Path to the encrypted .sql.enc file to restore. Required in a real "
                "disaster: if the database itself was destroyed, its BackupRecord table "
                "(--backup-id below) was destroyed with it — the file path is the only "
                "metadata that survives outside the DB."
            ),
        )
        parser.add_argument(
            "--backup-id",
            type=int,
            help=(
                "BackupRecord id to restore from (looked up via the ORM against the "
                "CURRENTLY CONNECTED database — only useful when that database is intact, "
                "e.g. restoring into a separate throwaway DB for a drill). Ignored if --file is given."
            ),
        )
        parser.add_argument("--yes", action="store_true", help="Required — confirms the overwrite")

    def handle(self, *args, file=None, backup_id=None, yes=False, **options):
        if not yes:
            raise CommandError(
                "This will overwrite the current database. Re-run with --yes to confirm."
            )
        if connection.vendor != "postgresql":
            raise CommandError("restore_db only supports the postgresql engine.")

        file_path = Path(file) if file else self._resolve_via_backup_record(backup_id)
        if not file_path.exists():
            raise CommandError(f"Backup file not found: {file_path}")

        encrypted = file_path.read_bytes()
        dump = decrypt_bytes(encrypted)

        db = connection.settings_dict
        cmd = [
            "psql",
            "-h", db.get("HOST") or "localhost",
            "-p", str(db.get("PORT") or 5432),
            "-U", db.get("USER") or "",
            db.get("NAME"),
        ]
        env = dict(os.environ)
        if db.get("PASSWORD"):
            env["PGPASSWORD"] = db["PASSWORD"]

        result = subprocess.run(cmd, input=dump, capture_output=True, env=env, check=False)
        if result.returncode != 0:
            raise CommandError(f"psql restore failed: {result.stderr.decode(errors='replace')}")

        self.stdout.write(self.style.SUCCESS(f"Restored {file_path.name} into {db.get('NAME')}."))

    def _resolve_via_backup_record(self, backup_id):
        from apps.core.models import BackupRecord

        record = (
            BackupRecord.objects.get(pk=backup_id)
            if backup_id
            else BackupRecord.objects.order_by("-created_at").first()
        )
        if not record:
            raise CommandError("No BackupRecord found, and no --file given.")
        return Path(record.file_path)
