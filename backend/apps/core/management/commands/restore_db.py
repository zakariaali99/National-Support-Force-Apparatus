import json
import os
import subprocess
import tempfile
from pathlib import Path

from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from apps.core.backup_crypto import decrypt_bytes


class Command(BaseCommand):
    help = (
        "DESTRUCTIVE: restores the database from an encrypted backup file, "
        "overwriting or loaddata into current database. Requires --yes."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            help="Path to the encrypted backup file to restore.",
        )
        parser.add_argument(
            "--backup-id",
            type=int,
            help="BackupRecord id to restore from.",
        )
        parser.add_argument("--yes", action="store_true", help="Required — confirms the overwrite")

    def handle(self, *args, file=None, backup_id=None, yes=False, **options):
        if not yes:
            raise CommandError("This will overwrite/update the current database. Re-run with --yes to confirm.")

        file_path = Path(file) if file else self._resolve_via_backup_record(backup_id)
        if not file_path.exists():
            raise CommandError(f"Backup file not found: {file_path}")

        encrypted = file_path.read_bytes()
        dump = decrypt_bytes(encrypted)

        # Check if dump is JSON data (SQLite dumpdata format)
        is_json = False
        try:
            parsed = json.loads(dump.decode("utf-8"))
            if isinstance(parsed, list):
                is_json = True
        except Exception:
            is_json = False

        db = connection.settings_dict

        if is_json:
            with tempfile.NamedTemporaryFile(suffix=".json", mode="wb", delete=False) as tmp:
                tmp.write(dump)
                tmp_path = tmp.name

            try:
                call_command("loaddata", tmp_path)
                self.stdout.write(self.style.SUCCESS(f"Successfully restored JSON dump into {db.get('NAME')}."))
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
        else:
            if connection.vendor == "postgresql":
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
            else:
                raise CommandError("PostgreSQL SQL dump cannot be restored directly into SQLite. Please use JSON backup format.")

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
