from django.test import TestCase
from rest_framework.test import APIClient

from apps.core.models import Role, User
from apps.equipment.models import InventoryCategory, InventoryItem
from apps.members.models import Member
from apps.organization.models import Faction, Rank
from apps.transportation.models import Vehicle


class VehicleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_superuser(
            username="transport_admin", password="password123", email="admin@nsfa.gov"
        )
        self.client.force_authenticate(self.user)

        self.rank = Rank.objects.create(code="sgt", name_ar="رقيب")
        self.faction1 = Faction.objects.create(code="patrol_f", name_ar="فصيل الدوريات")
        self.faction2 = Faction.objects.create(code="support_f", name_ar="فصيل الإسناد والأسلحة")

        self.driver = Member.objects.create(
            first_name="أحمد",
            second_name="سالم",
            last_name="المبروك",
            force_number="3011",
            national_number="119900123456",
            rank=self.rank,
            faction=self.faction1,
        )
        self.gunner = Member.objects.create(
            first_name="طارق",
            second_name="عمر",
            last_name="الورفلي",
            force_number="3012",
            national_number="119900654321",
            rank=self.rank,
            faction=self.faction2,
        )

        self.cat = InventoryCategory.objects.create(code="heavy_wpn", name_ar="أسلحة ثقيلة", category_type="machine_gun")
        self.weapon_item = InventoryItem.objects.create(
            category=self.cat,
            name="دوشكا 12.7 مم",
            serial_number="DSHK-9988",
            item_code="WPN-001",
            total_quantity=1,
            available_quantity=1,
            faction=self.faction2,
        )

    def test_create_vehicle_with_mounted_weapon_and_separate_affiliation(self):
        payload = {
            "name": "تويوتا لاندكروزر LC79 شاص",
            "vehicle_type": "patrol",
            "vin_number": "JTE79XXXX123456",
            "plate_number": "10-54321",
            "model_year": "2024",
            "color": "بيج عسكري",
            "status": "ready",
            "faction": self.faction1.id,
            "assigned_driver": self.driver.id,
            "has_weapon": True,
            "mounted_weapon_name": "دوشكا 12.7 مم",
            "mounted_weapon_serial": "DSHK-9988",
            "mounted_weapon_item": self.weapon_item.id,
            "weapon_faction": self.faction2.id,
            "weapon_assigned_member": self.gunner.id,
            "notes": "مركبة دورية مسلحة مجهزة بجهاز لاسلكي",
        }

        response = self.client.post("/api/transportation/vehicles/", payload)
        self.assertEqual(response.status_code, 201, response.data)

        vehicle = Vehicle.objects.get(id=response.data["id"])
        self.assertEqual(vehicle.name, "تويوتا لاندكروزر LC79 شاص")
        self.assertEqual(vehicle.vin_number, "JTE79XXXX123456")
        self.assertEqual(vehicle.assigned_driver, self.driver)
        self.assertEqual(vehicle.faction, self.faction1)
        self.assertTrue(vehicle.has_weapon)
        self.assertEqual(vehicle.weapon_faction, self.faction2)
        self.assertEqual(vehicle.weapon_assigned_member, self.gunner)

        # Check serialized helper displays
        self.assertEqual(response.data["driver_name"], "أحمد سالم المبروك")
        self.assertEqual(response.data["weapon_operator_name"], "طارق عمر الورفلي")
        self.assertEqual(response.data["faction_name"], "فصيل الدوريات")
        self.assertEqual(response.data["weapon_faction_name"], "فصيل الإسناد والأسلحة")

    def test_vehicle_without_weapon_clears_weapon_fields(self):
        payload = {
            "name": "تويوتا كورولا إدارية",
            "vehicle_type": "sedan",
            "vin_number": "COROLLA-2023-01",
            "plate_number": "10-11111",
            "has_weapon": False,
            "mounted_weapon_name": "رشاش",  # Should be stripped because has_weapon is False
            "faction": self.faction1.id,
        }

        response = self.client.post("/api/transportation/vehicles/", payload)
        self.assertEqual(response.status_code, 201, response.data)
        vehicle = Vehicle.objects.get(id=response.data["id"])
        self.assertFalse(vehicle.has_weapon)
        self.assertEqual(vehicle.mounted_weapon_name, "")
        self.assertIsNone(vehicle.weapon_faction)

    def test_external_unit_crud_and_vehicle_affiliation(self):
        from apps.transportation.models import ExternalUnit

        # 1. Create External Unit
        unit_res = self.client.post(
            "/api/transportation/external-units/",
            {
                "name_ar": "اللواء 444 قتال",
                "commander_name": "عقيد / محمود حمزة",
                "phone": "0910000001",
                "notes": "إعارة عملياتية مشتركة",
                "is_active": True,
            },
        )
        self.assertEqual(unit_res.status_code, 201, unit_res.data)
        unit_id = unit_res.data["id"]

        # 2. Create Vehicle affiliated with External Unit
        vehicle_res = self.client.post(
            "/api/transportation/vehicles/",
            {
                "name": "تويوتا لاندكروزر تابعة للواء 444",
                "vehicle_type": "patrol",
                "vin_number": "VIN-EXT-444-99",
                "plate_number": "10-44499",
                "affiliation_type": "external",
                "external_unit": unit_id,
                "assigned_driver": self.driver.id,
            },
        )
        self.assertEqual(vehicle_res.status_code, 201, vehicle_res.data)
        self.assertEqual(vehicle_res.data["external_unit_name"], "اللواء 444 قتال")
        self.assertEqual(vehicle_res.data["affiliation_type_display"], "تابعة لوحدة / جهة خارجية")

        # 3. Filter vehicles by external affiliation and external_unit
        filter_res = self.client.get(f"/api/transportation/vehicles/?affiliation_type=external&external_unit={unit_id}")
        self.assertEqual(filter_res.status_code, 200)
        items = filter_res.data["results"] if "results" in filter_res.data else filter_res.data
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["vin_number"], "VIN-EXT-444-99")

    def test_search_and_filtering(self):
        Vehicle.objects.create(
            name="إسعاف تويوتا هايس",
            vehicle_type="ambulance",
            vin_number="AMB-9988-1",
            plate_number="10-9999",
            faction=self.faction1,
        )
        Vehicle.objects.create(
            name="مصفحة نمر",
            vehicle_type="armored",
            vin_number="NIMR-001",
            plate_number="10-7777",
            faction=self.faction2,
            has_weapon=True,
            mounted_weapon_name="قاذف قنابل 40 مم",
        )

        res1 = self.client.get("/api/transportation/vehicles/?vehicle_type=ambulance")
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(len(res1.data["results"] if "results" in res1.data else res1.data), 1)

        res2 = self.client.get("/api/transportation/vehicles/?has_weapon=true")
        self.assertEqual(res2.status_code, 200)
        items2 = res2.data["results"] if "results" in res2.data else res2.data
        self.assertEqual(len(items2), 1)
        self.assertEqual(items2[0]["name"], "مصفحة نمر")
