from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient

from apps.attendance.models import DailyAttendance, ShiftRosterGroup
from apps.attendance.services.rotation import ShiftRotationService
from apps.core.models import User
from apps.members.models import Member, VacationTransaction
from apps.organization.models import Faction, Rank


class AttendanceAndShiftTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_superuser(
            username="attendance_admin", password="password123", email="att@nsfa.gov"
        )
        self.client.force_authenticate(self.user)

        self.rank = Rank.objects.create(code="cpl", name_ar="عريف")
        self.alert_faction = Faction.objects.create(code="alert_f", name_ar="فصيل الإنذار")
        self.guard_faction = Faction.objects.create(code="guard_f", name_ar="فصيل الحراسات")

        self.alert_member = Member.objects.create(
            first_name="علي",
            second_name="فرج",
            last_name="المقرحي",
            force_number="4001",
            national_number="119900111111",
            rank=self.rank,
            faction=self.alert_faction,
            vacation_balance_days=Decimal("10.0"),
        )

        self.guard_member = Member.objects.create(
            first_name="سالم",
            second_name="عثمان",
            last_name="الزوي",
            force_number="4002",
            national_number="119900222222",
            rank=self.rank,
            faction=self.guard_faction,
            vacation_balance_days=Decimal("15.0"),
        )

        # 1. Alert group: 1 work + 3 rest (cycle = 4)
        self.alert_group_a = ShiftRosterGroup.objects.create(
            faction=self.alert_faction,
            name_ar="نوبة الإنذار (أ)",
            pattern="alert_24_72",
            cycle_days=4,
            work_days=1,
            rest_days=3,
            anchor_date=date(2026, 1, 1),
            group_offset=0,
        )
        self.alert_group_a.members.add(self.alert_member)

        # 2. Guard group: 1 work + 4 rest (cycle = 5)
        self.guard_group_1 = ShiftRosterGroup.objects.create(
            faction=self.guard_faction,
            name_ar="نوبة الحراسة (1)",
            pattern="guard_24_96",
            cycle_days=5,
            work_days=1,
            rest_days=4,
            anchor_date=date(2026, 1, 1),
            group_offset=0,
        )
        self.guard_group_1.members.add(self.guard_member)

    def test_dynamic_shift_rotation_alert_and_guards(self):
        # Alert: cycle = 4. Day 0 = work, Day 1,2,3 = rest
        # Target: 2026-01-01 (Day 0) -> True (duty)
        # Target: 2026-01-02 (Day 1) -> False (off)
        # Target: 2026-01-03 (Day 2) -> False (off)
        # Target: 2026-01-04 (Day 3) -> False (off)
        # Target: 2026-01-05 (Day 4) -> True (duty)
        self.assertTrue(self.alert_group_a.is_on_duty_on(date(2026, 1, 1)))
        self.assertFalse(self.alert_group_a.is_on_duty_on(date(2026, 1, 2)))
        self.assertFalse(self.alert_group_a.is_on_duty_on(date(2026, 1, 3)))
        self.assertFalse(self.alert_group_a.is_on_duty_on(date(2026, 1, 4)))
        self.assertTrue(self.alert_group_a.is_on_duty_on(date(2026, 1, 5)))

        # Guard: cycle = 5. Day 0 = work, Day 1,2,3,4 = rest
        # Target: 2026-01-01 -> True
        # Target: 2026-01-05 -> False (Day 4 is rest)
        # Target: 2026-01-06 -> True (Day 5 is next cycle Day 0)
        self.assertTrue(self.guard_group_1.is_on_duty_on(date(2026, 1, 1)))
        self.assertFalse(self.guard_group_1.is_on_duty_on(date(2026, 1, 5)))
        self.assertTrue(self.guard_group_1.is_on_duty_on(date(2026, 1, 6)))

    def test_daily_sheet_and_monthly_matrix_apis(self):
        res_sheet = self.client.get(f"/api/attendance/records/daily-sheet/?date=2026-01-01&faction={self.alert_faction.id}")
        self.assertEqual(res_sheet.status_code, 200)
        self.assertEqual(res_sheet.data["total_members"], 1)
        self.assertEqual(res_sheet.data["items"][0]["expected_duty"], "duty")

        res_matrix = self.client.get(f"/api/attendance/records/monthly-matrix/?year=2026&month=1&faction={self.alert_faction.id}")
        self.assertEqual(res_matrix.status_code, 200)
        self.assertEqual(len(res_matrix.data["rows"]), 1)
        self.assertIn("1", res_matrix.data["rows"][0]["days"])

    def test_record_attendance_and_vacation_deduction_hourly(self):
        initial_balance = self.alert_member.vacation_balance_days  # 10.0

        # Record excused absence with 4 hours late/permission (4 hours = 0.5 day deduction)
        payload = {
            "date": "2026-01-05",
            "records": [
                {
                    "member_id": self.alert_member.id,
                    "status": "excused_absence",
                    "late_hours": "0.0",
                    "early_departure_hours": "0.0",
                    "excused_hours": "4.0",
                    "notes": "استئذان رسمي لمدة 4 ساعات لظرف عائلي",
                }
            ],
        }

        response = self.client.post("/api/attendance/records/record-bulk/", payload, format="json")
        self.assertEqual(response.status_code, 200, response.data)

        # Refresh member from DB
        self.alert_member.refresh_from_db()
        expected_balance = initial_balance - Decimal("0.5")  # 10.0 - 0.5 = 9.5
        self.assertEqual(self.alert_member.vacation_balance_days, expected_balance)

        # Verify DailyAttendance record
        att = DailyAttendance.objects.get(member=self.alert_member, date="2026-01-05")
        self.assertEqual(att.status, "excused_absence")
        self.assertEqual(att.excused_hours, Decimal("4.0"))
        self.assertEqual(att.deducted_vacation_days, Decimal("0.5"))
        self.assertIsNotNone(att.vacation_transaction)
