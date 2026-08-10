from datetime import date, timedelta
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase

from apps.core.models import Role, ScheduledJobRun, User
from apps.members.models import DocumentExpiryAlert, Member, MemberDocument
from apps.organization.models import DocumentType, Faction, Rank
from apps.workflow.models import Notification


class DocumentExpiryTests(TestCase):
    def setUp(self):
        self.rank = Rank.objects.create(code="exp-rank", name_ar="رتبة")
        self.faction = Faction.objects.create(code="exp-faction", name_ar="فصيل")
        self.member = Member.objects.create(
            first_name="سالم",
            second_name="علي",
            last_name="محمد",
            force_number="EXP-1",
            national_number="923456789012",
            rank=self.rank,
            faction=self.faction,
        )
        self.doc_type = DocumentType.objects.create(
            code="exp-doc", name_ar="جواز سفر", requires_expiry=True, expiry_warn_days=30
        )
        approver_role = Role.objects.create(
            name="exp-approver", name_ar="مشرف", permissions=["member.approve"], scope="own_faction"
        )
        self.approver = User.objects.create_user(username="exp-approver-user", password="x")
        self.approver.roles.add(approver_role)
        self.approver.factions.add(self.faction)

    def _make_document(self, expiry_date):
        return MemberDocument.objects.create(
            member=self.member,
            document_type=self.doc_type,
            file=SimpleUploadedFile("doc.pdf", b"%PDF-1.4 fake", content_type="application/pdf"),
            original_name="doc.pdf",
            content_type="application/pdf",
            file_size=10,
            sha256="a" * 64,
            expiry_date=expiry_date,
        )

    def test_document_within_warn_window_notifies_approver(self):
        self._make_document(date.today() + timedelta(days=10))

        call_command("check_document_expiry")

        self.assertTrue(Notification.objects.filter(recipient=self.approver, verb="document_expiring").exists())

    def test_document_outside_warn_window_is_not_alerted(self):
        self._make_document(date.today() + timedelta(days=90))

        call_command("check_document_expiry")

        self.assertFalse(Notification.objects.filter(verb="document_expiring").exists())

    def test_already_expired_document_still_alerts(self):
        self._make_document(date.today() - timedelta(days=5))

        call_command("check_document_expiry")

        self.assertTrue(Notification.objects.filter(verb="document_expiring").exists())

    def test_running_twice_does_not_duplicate_alerts(self):
        self._make_document(date.today() + timedelta(days=5))

        call_command("check_document_expiry")
        # Second run is a no-op because the job already succeeded for
        # today's period_key — simulates a duplicate cron fire.
        call_command("check_document_expiry")

        self.assertEqual(DocumentExpiryAlert.objects.count(), 1)
        self.assertEqual(Notification.objects.filter(verb="document_expiring").count(), 1)

    def test_job_run_recorded(self):
        self._make_document(date.today() + timedelta(days=5))

        call_command("check_document_expiry")

        run = ScheduledJobRun.objects.get(name="check_document_expiry")
        self.assertTrue(run.success)


class AccrueVacationTests(TestCase):
    def setUp(self):
        rank = Rank.objects.create(code="acc-rank", name_ar="رتبة")
        faction = Faction.objects.create(code="acc-faction", name_ar="فصيل")
        self.active_member = Member.objects.create(
            first_name="خالد",
            second_name="فرج",
            last_name="النور",
            force_number="ACC-1",
            national_number="923456789013",
            rank=rank,
            faction=faction,
            service_status="active",
        )
        self.retired_member = Member.objects.create(
            first_name="فرج",
            second_name="خالد",
            last_name="النور",
            force_number="ACC-2",
            national_number="923456789014",
            rank=rank,
            faction=faction,
            service_status="retired",
        )

    def test_accrues_only_active_members(self):
        call_command("accrue_vacation")

        self.active_member.refresh_from_db()
        self.retired_member.refresh_from_db()
        self.assertEqual(self.active_member.vacation_balance_days, Decimal("2"))
        self.assertEqual(self.retired_member.vacation_balance_days, Decimal("0"))

    def test_running_twice_in_same_month_does_not_double_accrue(self):
        call_command("accrue_vacation")
        call_command("accrue_vacation")

        self.active_member.refresh_from_db()
        self.assertEqual(self.active_member.vacation_balance_days, Decimal("2"))
