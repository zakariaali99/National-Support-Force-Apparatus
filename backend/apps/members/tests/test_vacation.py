from decimal import Decimal

from django.test import TestCase

from rest_framework.test import APIClient

from apps.core.models import Role, User
from apps.members.models import Member
from apps.members.models.vacation import VacationTransaction
from apps.members.services.vacation import apply_vacation_transaction, recompute_balance
from apps.organization.models import Faction, Rank


class VacationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        rank = Rank.objects.create(code="private", name_ar="جندي")
        faction = Faction.objects.create(code="fx", name_ar="فصيل")
        self.member = Member.objects.create(
            first_name="سالم",
            second_name="علي",
            last_name="محمد",
            force_number="V-1",
            national_number="523456789012",
            rank=rank,
            faction=faction,
        )

        approver_role = Role.objects.create(
            name="approver",
            name_ar="معتمد",
            permissions=["member.view", "member.edit", "vacation.approve"],
            scope="all",
        )
        self.approver = User.objects.create_user(username="approver", password="x")
        self.approver.roles.add(approver_role)

        requester_role = Role.objects.create(
            name="requester", name_ar="طالب", permissions=["member.view", "member.edit"], scope="all"
        )
        self.requester = User.objects.create_user(username="requester", password="x")
        self.requester.roles.add(requester_role)


class VacationServiceTests(VacationTestCase):
    def test_apply_transaction_updates_cached_balance(self):
        apply_vacation_transaction(member_id=self.member.id, days=Decimal("5"), kind="accrual")

        self.member.refresh_from_db()
        self.assertEqual(self.member.vacation_balance_days, Decimal("5"))

    def test_recompute_balance_matches_ledger_sum(self):
        apply_vacation_transaction(member_id=self.member.id, days=Decimal("10"), kind="accrual")
        apply_vacation_transaction(member_id=self.member.id, days=Decimal("-3"), kind="deduction")
        # Corrupt the cache directly to prove recompute repairs it from the ledger.
        Member.objects.filter(pk=self.member.id).update(vacation_balance_days=Decimal("999"))

        total = recompute_balance(self.member.id)

        self.assertEqual(total, Decimal("7"))
        self.member.refresh_from_db()
        self.assertEqual(self.member.vacation_balance_days, Decimal("7"))


class VacationRequestApiTests(VacationTestCase):
    def test_request_create_start_after_end_rejected(self):
        self.client.force_authenticate(self.requester)

        response = self.client.post(
            "/api/vacation-requests/",
            {
                "member": self.member.id,
                "start_date": "2026-06-10",
                "end_date": "2026-06-01",
                "days": "5",
            },
        )

        self.assertEqual(response.status_code, 400)

    def test_approving_request_deducts_balance_and_writes_ledger_row(self):
        apply_vacation_transaction(member_id=self.member.id, days=Decimal("10"), kind="accrual")
        self.client.force_authenticate(self.requester)
        request_id = self.client.post(
            "/api/vacation-requests/",
            {
                "member": self.member.id,
                "start_date": "2026-06-01",
                "end_date": "2026-06-05",
                "days": "4",
            },
        ).data["id"]

        self.client.force_authenticate(self.approver)
        response = self.client.post(f"/api/vacation-requests/{request_id}/approve/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["status"], "approved")
        self.member.refresh_from_db()
        self.assertEqual(self.member.vacation_balance_days, Decimal("6"))
        self.assertTrue(
            VacationTransaction.objects.filter(member=self.member, kind="deduction", days=Decimal("-4")).exists()
        )

    def test_requester_without_vacation_approve_permission_cannot_approve(self):
        self.client.force_authenticate(self.requester)
        request_id = self.client.post(
            "/api/vacation-requests/",
            {
                "member": self.member.id,
                "start_date": "2026-06-01",
                "end_date": "2026-06-05",
                "days": "4",
            },
        ).data["id"]

        response = self.client.post(f"/api/vacation-requests/{request_id}/approve/")

        self.assertEqual(response.status_code, 403)

    def test_rejecting_request_does_not_touch_balance(self):
        self.client.force_authenticate(self.requester)
        request_id = self.client.post(
            "/api/vacation-requests/",
            {
                "member": self.member.id,
                "start_date": "2026-06-01",
                "end_date": "2026-06-05",
                "days": "4",
            },
        ).data["id"]

        self.client.force_authenticate(self.approver)
        response = self.client.post(f"/api/vacation-requests/{request_id}/reject/")

        self.assertEqual(response.status_code, 200, response.data)
        self.member.refresh_from_db()
        self.assertEqual(self.member.vacation_balance_days, Decimal("0"))

    def test_cannot_approve_already_decided_request(self):
        self.client.force_authenticate(self.requester)
        request_id = self.client.post(
            "/api/vacation-requests/",
            {
                "member": self.member.id,
                "start_date": "2026-06-01",
                "end_date": "2026-06-05",
                "days": "4",
            },
        ).data["id"]
        self.client.force_authenticate(self.approver)
        self.client.post(f"/api/vacation-requests/{request_id}/reject/")

        response = self.client.post(f"/api/vacation-requests/{request_id}/approve/")

        self.assertEqual(response.status_code, 403)

    def test_status_not_settable_via_plain_patch(self):
        self.client.force_authenticate(self.requester)
        request_id = self.client.post(
            "/api/vacation-requests/",
            {
                "member": self.member.id,
                "start_date": "2026-06-01",
                "end_date": "2026-06-05",
                "days": "4",
            },
        ).data["id"]

        response = self.client.patch(f"/api/vacation-requests/{request_id}/", {"status": "approved"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "pending")
