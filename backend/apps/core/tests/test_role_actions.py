from django.test import TestCase
from rest_framework.test import APIClient

from apps.core.models import Role, User
from apps.core.permissions.registry import SYSTEM_ROLE_PRESETS
from apps.organization.models import Faction, Rank
from apps.members.models import Member
from apps.equipment.models import InventoryCategory, InventoryItem, CustodyRecord
from apps.transportation.models import Vehicle, ExternalUnit
from apps.attendance.models import DailyAttendance, ShiftRosterGroup


class ComprehensiveRoleActionTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.faction_a = Faction.objects.create(code="faction-a", name_ar="فصيل أ")
        cls.faction_b = Faction.objects.create(code="faction-b", name_ar="فصيل ب")
        cls.rank = Rank.objects.create(code="soldier", name_ar="جندي", order=1)

        # Create members
        cls.member_a = Member.objects.create(
            first_name="أحمد",
            second_name="علي",
            last_name="المبروك",
            national_number="119900112233",
            force_number="A100",
            faction=cls.faction_a,
            rank=cls.rank,
        )
        cls.member_b = Member.objects.create(
            first_name="سالم",
            second_name="عمر",
            last_name="الورفلي",
            national_number="119900112244",
            force_number="B200",
            faction=cls.faction_b,
            rank=cls.rank,
        )

        # Categories for Armory and General Inventory
        cls.armory_cat = InventoryCategory.objects.create(
            code="weapons-cat",
            name_ar="بنادق هجومية",
            domain="armory",
            category_type="rifle",
        )
        cls.general_cat = InventoryCategory.objects.create(
            code="gear-cat",
            name_ar="مهمات وقاية وتجهيزات",
            domain="inventory",
            category_type="armor",
        )

        # Items in Armory and General Inventory
        cls.weapon_item = InventoryItem.objects.create(
            item_code="W-AK-101",
            name="بندقية كلاشينكوف AK-47",
            domain="armory",
            serial_number="KAL-982110",
            category=cls.armory_cat,
            faction=cls.faction_a,
            total_quantity=1,
            available_quantity=1,
        )
        cls.general_item = InventoryItem.objects.create(
            item_code="G-VEST-01",
            name="سترة تكتيكية واقية",
            domain="inventory",
            category=cls.general_cat,
            faction=cls.faction_a,
            total_quantity=50,
            available_quantity=50,
        )

        # Vehicle
        cls.vehicle = Vehicle.objects.create(
            name="تويوتا لاندكروزر مصفحة",
            plate_number="10-12345",
            vin_number="VIN-TOYOTA-987654",
            faction=cls.faction_a,
            status="ready",
        )

        # System Roles
        cls.roles = {}
        for role_key, preset in SYSTEM_ROLE_PRESETS.items():
            cls.roles[role_key] = Role.objects.create(
                name=f"test-{role_key}",
                name_ar=preset["name_ar"],
                scope=preset["scope"],
                permissions=preset["permissions"],
            )

        # Users
        cls.superuser = User.objects.create_superuser(
            username="test_super", password="x", email="super@nasf.ly"
        )
        cls.admin_user = User.objects.create_user(username="test_admin", password="x")
        cls.admin_user.roles.add(cls.roles["admin"])

        cls.supervisor_user = User.objects.create_user(username="test_supervisor", password="x")
        cls.supervisor_user.roles.add(cls.roles["supervisor"])
        cls.supervisor_user.factions.add(cls.faction_a)

        cls.armory_officer_user = User.objects.create_user(username="test_armory", password="x")
        cls.armory_officer_user.roles.add(cls.roles["armory_officer"])
        cls.armory_officer_user.factions.add(cls.faction_a)

        cls.inventory_officer_user = User.objects.create_user(username="test_inventory", password="x")
        cls.inventory_officer_user.roles.add(cls.roles["inventory_officer"])
        cls.inventory_officer_user.factions.add(cls.faction_a)

        cls.transport_officer_user = User.objects.create_user(username="test_transport", password="x")
        cls.transport_officer_user.roles.add(cls.roles["transport_officer"])
        cls.transport_officer_user.factions.add(cls.faction_a)

        cls.attendance_officer_user = User.objects.create_user(username="test_attendance", password="x")
        cls.attendance_officer_user.roles.add(cls.roles["attendance_officer"])
        cls.attendance_officer_user.factions.add(cls.faction_a)

        cls.hr_officer_user = User.objects.create_user(username="test_hr", password="x")
        cls.hr_officer_user.roles.add(cls.roles["hr_officer"])
        cls.hr_officer_user.factions.add(cls.faction_a)

        cls.data_entry_user = User.objects.create_user(username="test_data_entry", password="x")
        cls.data_entry_user.roles.add(cls.roles["data_entry"])
        cls.data_entry_user.factions.add(cls.faction_a)

        cls.viewer_user = User.objects.create_user(username="test_viewer", password="x")
        cls.viewer_user.roles.add(cls.roles["viewer"])
        cls.viewer_user.factions.add(cls.faction_a)

        cls.unprivileged_user = User.objects.create_user(username="test_unprivileged", password="x")

    def setUp(self):
        self.client = APIClient()

    # --- 1. Superuser & Admin Tests ---
    def test_superuser_has_unrestricted_access(self):
        self.client.force_authenticate(self.superuser)

        self.assertEqual(self.client.get("/api/members/").status_code, 200)
        self.assertEqual(self.client.get("/api/equipment/items/").status_code, 200)
        self.assertEqual(self.client.get("/api/transportation/vehicles/").status_code, 200)
        self.assertEqual(self.client.get("/api/attendance/records/").status_code, 200)
        self.assertEqual(self.client.get("/api/audit/activity/").status_code, 200)
        self.assertEqual(self.client.get("/api/backups/").status_code, 200)
        self.assertEqual(self.client.get("/api/roles/").status_code, 200)

    # --- 2. Armory Officer (مسؤول التسليح) Tests ---
    def test_armory_officer_permissions(self):
        self.client.force_authenticate(self.armory_officer_user)

        # Can view and manage armory items
        res_items = self.client.get("/api/equipment/items/?domain=armory")
        self.assertEqual(res_items.status_code, 200)

        # Can create a new weapon in Armory
        res_create_weapon = self.client.post(
            "/api/equipment/items/",
            {
                "name": "مسدس بيريتا 9مم",
                "item_code": "W-BER-202",
                "domain": "armory",
                "serial_number": "BER-445566",
                "category": self.armory_cat.id,
                "faction": self.faction_a.id,
                "total_quantity": 1,
                "available_quantity": 1,
            },
        )
        self.assertEqual(res_create_weapon.status_code, 201)

        # Can assign weapon custody to a member
        res_custody = self.client.post(
            f"/api/equipment/items/{self.weapon_item.id}/assign-custody/",
            {
                "member_id": self.member_a.id,
                "quantity": 1,
                "destination": "حماية ميدانية",
                "purpose": "مهمة دورية رسمية",
                "notes": "صرف عهدة سلاح رسمي",
            },
        )
        self.assertEqual(res_custody.status_code, 200)

        # Cannot modify transportation vehicles or manage users/roles
        self.assertEqual(self.client.get("/api/transportation/vehicles/").status_code, 403)
        self.assertEqual(self.client.get("/api/users/").status_code, 403)
        self.assertEqual(self.client.get("/api/roles/").status_code, 403)

    # --- 3. Transportation Officer (مسؤول النقليات والحركة) Tests ---
    def test_transport_officer_permissions(self):
        self.client.force_authenticate(self.transport_officer_user)

        # Can view vehicles
        res_vehicles = self.client.get("/api/transportation/vehicles/")
        self.assertEqual(res_vehicles.status_code, 200)

        # Can assign driver to vehicle with destination & purpose & notes
        res_assign = self.client.post(
            f"/api/transportation/vehicles/{self.vehicle.id}/assign-driver/",
            {
                "driver_id": self.member_a.id,
                "destination": "مطار طرابلس الدولي",
                "purpose": "استقبال وتأمين وفد رسمي",
                "notes": "تحرك مع طاقم الحراسة",
            },
        )
        self.assertEqual(res_assign.status_code, 200)

        # Can return vehicle
        res_return = self.client.post(
            f"/api/transportation/vehicles/{self.vehicle.id}/return-vehicle/",
            {
                "odometer": 15600,
                "status": "ready",
                "notes": "تمت العودة والآلية سليمة",
            },
        )
        self.assertEqual(res_return.status_code, 200)

        # Cannot manage roles or backups
        self.assertEqual(self.client.get("/api/roles/").status_code, 403)
        self.assertEqual(self.client.get("/api/backups/").status_code, 403)

    # --- 4. Attendance Officer (مسؤول التمام والانضباط) Tests ---
    def test_attendance_officer_permissions(self):
        self.client.force_authenticate(self.attendance_officer_user)

        # Can view attendance records
        self.assertEqual(self.client.get("/api/attendance/records/").status_code, 200)

        # Can record attendance for a member
        res_record = self.client.post(
            "/api/attendance/records/",
            {
                "member": self.member_a.id,
                "date": "2026-08-20",
                "status": "present",
                "notes": "حضور في الموعد المحدد",
            },
        )
        self.assertEqual(res_record.status_code, 201)

        # Cannot delete members or manage vehicles
        self.assertEqual(self.client.delete(f"/api/members/{self.member_a.id}/").status_code, 403)
        self.assertEqual(self.client.get("/api/transportation/vehicles/").status_code, 403)

    # --- 5. HR Officer (مسؤول شؤون المنتسبين) Tests ---
    def test_hr_officer_permissions(self):
        self.client.force_authenticate(self.hr_officer_user)

        # Can create and edit members
        res_create = self.client.post(
            "/api/members/",
            {
                "first_name": "طارق",
                "second_name": "مصطفى",
                "last_name": "الزوي",
                "national_number": "119933445566",
                "force_number": "A105",
                "faction": self.faction_a.id,
                "rank": self.rank.id,
            },
        )
        self.assertEqual(res_create.status_code, 201)

        # Can edit member
        new_id = res_create.data["id"]
        res_patch = self.client.patch(
            f"/api/members/{new_id}/", {"current_residence": "طرابلس - زاوية الدهماني"}
        )
        self.assertEqual(res_patch.status_code, 200)

        # Cannot modify armory weapons
        self.assertEqual(
            self.client.post(
                "/api/equipment/items/",
                {
                    "name": "سلاح محظور",
                    "item_code": "W-TEST",
                    "domain": "armory",
                    "category": self.armory_cat.id,
                },
            ).status_code,
            403,
        )

    # --- 6. Viewer (مطّلع / مراقب) Read-Only Tests ---
    def test_viewer_read_only_enforcement(self):
        self.client.force_authenticate(self.viewer_user)

        # Can view records across allowed modules
        self.assertEqual(self.client.get("/api/members/").status_code, 200)
        self.assertEqual(self.client.get("/api/equipment/items/").status_code, 200)
        self.assertEqual(self.client.get("/api/transportation/vehicles/").status_code, 200)
        self.assertEqual(self.client.get("/api/attendance/records/").status_code, 200)

        # Cannot POST/PUT/PATCH/DELETE anything
        res_post = self.client.post(
            "/api/members/",
            {
                "first_name": "ممنوع",
                "second_name": "المحاولة",
                "last_name": "التسجيل",
                "national_number": "119999999999",
                "force_number": "X000",
                "faction": self.faction_a.id,
                "rank": self.rank.id,
            },
        )
        self.assertEqual(res_post.status_code, 403)

    # --- 7. Faction Scoping Enforcement ---
    def test_faction_scoping_enforcement(self):
        self.client.force_authenticate(self.supervisor_user)

        # User is assigned only to Faction A
        res = self.client.get("/api/members/")
        self.assertEqual(res.status_code, 200)
        results = res.data.get("results", res.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["national_number"], "119900112233")

        # Faction B member cannot be edited (404 due to queryset scoping)
        res_edit_b = self.client.patch(
            f"/api/members/{self.member_b.id}/", {"first_name": "سالم المعدل"}
        )
        self.assertEqual(res_edit_b.status_code, 404)

    # --- 8. Unprivileged & Anonymous Tests ---
    def test_unprivileged_and_anonymous_access(self):
        # Unprivileged logged-in user
        self.client.force_authenticate(self.unprivileged_user)
        self.assertEqual(self.client.get("/api/members/").status_code, 403)
        self.assertEqual(self.client.get("/api/equipment/items/").status_code, 403)
        self.assertEqual(self.client.get("/api/transportation/vehicles/").status_code, 403)

        # Public lookup endpoints return 200 for any authenticated user
        self.assertEqual(self.client.get("/api/ranks/").status_code, 200)
        self.assertEqual(self.client.get("/api/factions/").status_code, 200)

        # Anonymous user
        self.client.logout()
        self.assertEqual(self.client.get("/api/members/").status_code, 401)
        self.assertEqual(self.client.get("/api/equipment/items/").status_code, 401)
