from datetime import date, timedelta
from django.test import TestCase

from apps.attendance.models import DailyAttendance, ShiftRosterGroup
from apps.attendance.services.rotation import ShiftRotationService
from apps.members.models import Member
from apps.organization.models import Faction, Rank


class ShiftAbsenceCascadeTest(TestCase):
    def setUp(self):
        self.rank = Rank.objects.create(code="casc-rank", name_ar="عريف")
        self.faction = Faction.objects.create(code="casc-faction", name_ar="فصيل الاستطلاع")

        self.member = Member.objects.create(
            first_name="سالم",
            last_name="التواتي",
            force_number="M-CASC-1",
            national_number="123456789012",
            rank=self.rank,
            faction=self.faction,
        )

        # 24/72 Alert shift: 1 day work, 3 days rest, cycle_days=4
        self.shift_group = ShiftRosterGroup.objects.create(
            faction=self.faction,
            name_ar="نوبة الاستطلاع أ",
            pattern="alert_24_72",
            cycle_days=4,
            work_days=1,
            rest_days=3,
            anchor_date=date(2026, 1, 1),
            group_offset=0,
            shift_hours=24.0,
            is_active=True,
        )
        self.shift_group.members.add(self.member)

    def test_duty_day_absence_cascades_to_consecutive_rest_days(self):
        # 2026-01-01 is anchor date with offset 0 -> Day 0 in cycle -> On Duty
        duty_date = date(2026, 1, 1)
        self.assertTrue(self.shift_group.is_on_duty_on(duty_date))

        # Record unexcused absence on duty day
        record = ShiftRotationService.record_attendance(
            member=self.member,
            target_date=duty_date,
            status="unexcused_absence",
            notes="غياب عن نوبة العمل الرسمية",
        )
        self.assertEqual(record.status, "unexcused_absence")

        # Verify that the 3 following rest days (Jan 2, Jan 3, Jan 4) were automatically marked absent
        for offset in (1, 2, 3):
            rest_date = duty_date + timedelta(days=offset)
            rest_rec = DailyAttendance.objects.filter(member=self.member, date=rest_date).first()
            self.assertIsNotNone(rest_rec, f"Record for {rest_date} should be auto-created")
            self.assertEqual(rest_rec.status, "unexcused_absence")
            self.assertIn("غياب متتابع تلقائي", rest_rec.notes)

    def test_correcting_duty_day_to_present_reverts_cascaded_rest_days(self):
        duty_date = date(2026, 1, 1)

        # First mark absent
        ShiftRotationService.record_attendance(
            member=self.member,
            target_date=duty_date,
            status="unexcused_absence",
        )

        # Now correct to present
        ShiftRotationService.record_attendance(
            member=self.member,
            target_date=duty_date,
            status="present",
        )

        # Verify that cascaded rest days reverted to shift_off
        for offset in (1, 2, 3):
            rest_date = duty_date + timedelta(days=offset)
            rest_rec = DailyAttendance.objects.filter(member=self.member, date=rest_date).first()
            self.assertIsNotNone(rest_rec)
            self.assertEqual(rest_rec.status, "shift_off")
