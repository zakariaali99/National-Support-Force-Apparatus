import io
from django.test import TestCase
from rest_framework.test import APIClient
from pypdf import PdfReader

from apps.core.models import Role, User
from apps.organization.models import Faction, Rank
from apps.members.models import Member
from apps.transportation.models import Vehicle
from apps.equipment.models import InventoryItem, InventoryCategory
from apps.attendance.models import DailyAttendance


class OfficialPdfEndpointsTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.rank = Rank.objects.create(code="pdf-rank", name_ar="ملازم")
        self.faction = Faction.objects.create(code="pdf-faction", name_ar="كتيبة المشاة")

        self.user = User.objects.create_user(username="pdf_officer", password="password123")
        role = Role.objects.create(
            name="logistics_officer",
            name_ar="ضابط إمداد وعمليات",
            permissions=[
                "equipment.view",
                "equipment.manage",
                "transportation.view",
                "transportation.manage",
                "attendance.view",
                "attendance.record",
            ],
            scope="all",
        )
        self.user.roles.add(role)
        self.client.force_authenticate(user=self.user)

        self.member = Member.objects.create(
            first_name="علي",
            last_name="المبروك",
            force_number="M-991",
            national_number="987654321012",
            rank=self.rank,
            faction=self.faction,
        )

        self.category = InventoryCategory.objects.create(name_ar="الأسلحة الخفيفة", code="weap")
        self.item = InventoryItem.objects.create(
            name="بندقية كلاشينكوف AK-47",
            item_code="W-001",
            category=self.category,
            total_quantity=5,
            available_quantity=4,
            assigned_quantity=1,
            serial_number="AK-778899",
        )

        self.vehicle = Vehicle.objects.create(
            name="تويوتا لاند كروزر 70",
            plate_number="1234-56",
            vin_number="VIN-TOYOTA-7711",
            faction=self.faction,
            assigned_driver=self.member,
            has_weapon=True,
            mounted_weapon_name="رشاش 14.5 ملم",
            mounted_weapon_serial="DSHK-9900",
            weapon_assigned_member=self.member,
        )

        self.attendance_record = DailyAttendance.objects.create(
            member=self.member,
            date="2026-08-17",
            status="present",
        )

    def test_custody_voucher_pdf(self):
        res = self.client.get(
            "/api/reports/inventory/custody-voucher/",
            {
                "voucher_number": "VCH-TEST-01",
                "recipient_name": self.member.full_name,
                "item_name": self.item.name,
                "item_code": self.item.item_code,
                "item_serial": self.item.serial_number,
                "quantity": "1",
            },
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res["Content-Type"], "application/pdf")
        reader = PdfReader(io.BytesIO(res.content))
        self.assertGreater(len(reader.pages), 0)

    def test_vehicle_trip_ticket_pdf(self):
        res = self.client.get(
            f"/api/reports/transportation/vehicle/{self.vehicle.id}/trip-ticket/",
            {"destination": "طرابلس — سرت"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res["Content-Type"], "application/pdf")
        reader = PdfReader(io.BytesIO(res.content))
        self.assertGreater(len(reader.pages), 0)

    def test_daily_attendance_pdf(self):
        res = self.client.get(
            "/api/reports/attendance/daily/pdf/",
            {"date": "2026-08-17", "faction": self.faction.id},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res["Content-Type"], "application/pdf")
        reader = PdfReader(io.BytesIO(res.content))
        self.assertGreater(len(reader.pages), 0)

    def test_inventory_summary_pdf(self):
        res = self.client.get("/api/reports/inventory/summary/pdf/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res["Content-Type"], "application/pdf")
        reader = PdfReader(io.BytesIO(res.content))
        self.assertGreater(len(reader.pages), 0)

    def test_monthly_attendance_pdf(self):
        res = self.client.get(
            "/api/reports/attendance/monthly/pdf/",
            {"year": "2026", "month": "8", "faction": self.faction.id},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res["Content-Type"], "application/pdf")
        reader = PdfReader(io.BytesIO(res.content))
        self.assertGreater(len(reader.pages), 0)

    def test_daily_attendance_pdf_with_query_token(self):
        from rest_framework_simplejwt.tokens import RefreshToken

        token = str(RefreshToken.for_user(self.user).access_token)
        unauthed_client = APIClient()  # No force_authenticate, no Authorization header

        res = unauthed_client.get(
            "/api/reports/attendance/daily/pdf/",
            {"date": "2026-08-17", "faction": self.faction.id, "token": token},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res["Content-Type"], "application/pdf")
        reader = PdfReader(io.BytesIO(res.content))
        self.assertGreater(len(reader.pages), 0)
