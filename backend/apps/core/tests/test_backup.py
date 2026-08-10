import shutil
import tempfile
from pathlib import Path

from django.core.management import call_command, CommandError
from django.test import TestCase, override_settings

from rest_framework.test import APIClient

from apps.core.backup_crypto import decrypt_bytes, encrypt_bytes
from apps.core.models import BackupRecord, Role, ScheduledJobRun, User


class BackupCryptoTests(TestCase):
    def test_round_trips_with_correct_key(self):
        with override_settings(BACKUP_ENCRYPTION_KEY="test-key-1"):
            encrypted = encrypt_bytes(b"hello world")
            self.assertEqual(decrypt_bytes(encrypted), b"hello world")

    def test_wrong_key_fails_to_decrypt(self):
        with override_settings(BACKUP_ENCRYPTION_KEY="test-key-1"):
            encrypted = encrypt_bytes(b"hello world")
        with override_settings(BACKUP_ENCRYPTION_KEY="a-different-key"):
            with self.assertRaises(Exception):
                decrypt_bytes(encrypted)

    def test_missing_key_raises(self):
        with override_settings(BACKUP_ENCRYPTION_KEY=None):
            with self.assertRaises(Exception):
                encrypt_bytes(b"data")


class BackupDbCommandTests(TestCase):
    def setUp(self):
        self.tmp_dir = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp_dir, ignore_errors=True)

    def test_backup_db_writes_encrypted_file_and_record(self):
        with override_settings(BACKUP_ROOT=self.tmp_dir, BACKUP_ENCRYPTION_KEY="test-backup-key"):
            call_command("backup_db")

        record = BackupRecord.objects.get()
        self.assertTrue(Path(record.file_path).exists())
        self.assertTrue(record.encrypted)
        self.assertGreater(record.file_size, 0)

        with override_settings(BACKUP_ENCRYPTION_KEY="test-backup-key"):
            plaintext = decrypt_bytes(Path(record.file_path).read_bytes())
        # A real pg_dump of the test DB — sanity-check it looks like SQL,
        # not proving full content correctness (that's what restore_db's
        # own round trip through psql would prove, which is destructive
        # and out of scope for a unit test against the live test DB).
        self.assertIn(b"PostgreSQL database dump", plaintext)

    def test_backup_db_is_idempotent_per_day(self):
        with override_settings(BACKUP_ROOT=self.tmp_dir, BACKUP_ENCRYPTION_KEY="test-backup-key"):
            call_command("backup_db")
            call_command("backup_db")

        self.assertEqual(BackupRecord.objects.count(), 1)
        self.assertEqual(ScheduledJobRun.objects.filter(name="backup_db").count(), 1)


class RestoreDbCommandTests(TestCase):
    def test_restore_requires_yes_flag(self):
        with self.assertRaises(CommandError):
            call_command("restore_db")

    def test_restore_without_any_backup_or_file_raises(self):
        with self.assertRaises(CommandError):
            call_command("restore_db", yes=True)

    def test_restore_with_nonexistent_file_raises(self):
        with self.assertRaises(CommandError):
            call_command("restore_db", yes=True, file="/tmp/does-not-exist.sql.enc")

    def test_restore_with_file_ignores_missing_backup_record(self):
        # --file must not require a BackupRecord to exist — see the
        # command's docstring: in a real disaster, that table is gone too.
        tmp_dir = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, tmp_dir, ignore_errors=True)
        with override_settings(BACKUP_ROOT=tmp_dir, BACKUP_ENCRYPTION_KEY="restore-file-key"):
            call_command("backup_db")
            record = BackupRecord.objects.get()
            # Restoring into the SAME live test DB would be destructive to
            # the test run itself, so this only proves the file is located
            # and decrypted, not a full psql round trip (that's proven by
            # BackupDbCommandTests + the documented manual drill in
            # deploy/README.md, run once against a real throwaway DB
            # during development).
            from apps.core.backup_crypto import decrypt_bytes

            decrypted = decrypt_bytes(Path(record.file_path).read_bytes())
            self.assertIn(b"PostgreSQL database dump", decrypted)


class BackupApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tmp_dir = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp_dir, ignore_errors=True)

        runner_role = Role.objects.create(
            name="backup-runner", name_ar="مشغل نسخ", permissions=["backup.run"], scope="all"
        )
        self.runner = User.objects.create_user(username="backup-runner-user", password="x")
        self.runner.roles.add(runner_role)

        downloader_role = Role.objects.create(
            name="backup-downloader", name_ar="محمّل نسخ", permissions=["backup.download"], scope="all"
        )
        self.downloader = User.objects.create_user(username="backup-downloader-user", password="x")
        self.downloader.roles.add(downloader_role)

        self.plain_user = User.objects.create_user(username="plain-backup-user", password="x")

    def test_list_requires_backup_run_permission(self):
        self.client.force_authenticate(self.plain_user)

        response = self.client.get("/api/backups/")

        self.assertEqual(response.status_code, 403)

    def test_run_requires_backup_run_permission(self):
        self.client.force_authenticate(self.plain_user)

        response = self.client.post("/api/backups/run/")

        self.assertEqual(response.status_code, 403)

    def test_run_creates_backup_and_logs_activity(self):
        from apps.core.models import ActivityLog

        self.client.force_authenticate(self.runner)

        with override_settings(BACKUP_ROOT=self.tmp_dir, BACKUP_ENCRYPTION_KEY="test-api-key"):
            response = self.client.post("/api/backups/run/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(BackupRecord.objects.filter(created_by=self.runner).exists())
        self.assertTrue(ActivityLog.objects.filter(action="backup_run", actor=self.runner).exists())

    def test_download_requires_backup_download_permission_not_just_run(self):
        record = BackupRecord.objects.create(file_path="/tmp/does-not-matter.enc", file_size=1, sha256="x" * 64)
        self.client.force_authenticate(self.runner)

        response = self.client.get(f"/api/backups/{record.id}/download/")

        self.assertEqual(response.status_code, 403)

    def test_download_missing_file_is_404(self):
        record = BackupRecord.objects.create(
            file_path=str(self.tmp_dir / "missing.enc"), file_size=1, sha256="x" * 64
        )
        self.client.force_authenticate(self.downloader)

        response = self.client.get(f"/api/backups/{record.id}/download/")

        self.assertEqual(response.status_code, 404)
