from django.test import TestCase
from rest_framework.test import APIClient

from apps.core.models import User
from apps.equipment.models import CustodyRecord, InventoryCategory, InventoryItem
from apps.members.models import Member
from apps.organization.models import Faction, Rank


class EquipmentStockAndCustodyTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_superuser(
            username="stock_admin", password="password123", email="stock@nsfa.gov"
        )
        self.client.force_authenticate(self.user)

        self.rank = Rank.objects.create(code="pvt", name_ar="جندي")
        self.faction = Faction.objects.create(code="infantry", name_ar="فصيل المشاة")
        self.member = Member.objects.create(
            first_name="سليمان",
            second_name="أحمد",
            last_name="التواتي",
            force_number="5001",
            national_number="119900333333",
            rank=self.rank,
            faction=self.faction,
        )

        self.cat = InventoryCategory.objects.create(
            code="uniforms", name_ar="مهمات عسكرية وتجهيزات", category_type="uniform"
        )

    def test_item_stock_creation_and_custody_deduction(self):
        # Create item with 50 uniforms in warehouse
        payload = {
            "category": self.cat.id,
            "name": "بدلة عسكرية رقم 1 (صحراوي)",
            "item_code": "UNIF-01",
            "size_spec": "مقاس XL",
            "total_quantity": 50,
            "available_quantity": 50,
            "status": "good",
        }

        res = self.client.post("/api/inventory/items/", payload)
        self.assertEqual(res.status_code, 201, res.data)
        item_id = res.data["id"]

        item = InventoryItem.objects.get(id=item_id)
        self.assertEqual(item.total_quantity, 50)
        self.assertEqual(item.available_quantity, 50)
        self.assertEqual(item.assigned_quantity, 0)

        # 1. Assign 5 units to member as custody
        res_assign = self.client.post(
            f"/api/inventory/items/{item_id}/assign-custody/",
            {"member_id": self.member.id, "quantity": 5, "notes": "صرف 5 بدلات"},
        )
        self.assertEqual(res_assign.status_code, 200, res_assign.data)
        item.refresh_from_db()
        self.assertEqual(item.available_quantity, 45)
        self.assertEqual(item.assigned_quantity, 5)

        # 2. Return 3 units back to warehouse
        res_return = self.client.post(
            f"/api/inventory/items/{item_id}/release-custody/",
            {"quantity": 3, "notes": "إرجاع 3 بدلات فائضة"},
        )
        self.assertEqual(res_return.status_code, 200, res_return.data)
        item.refresh_from_db()
        self.assertEqual(item.available_quantity, 48)
        self.assertEqual(item.assigned_quantity, 2)

        # 3. Mark 2 remaining assigned units as damaged
        res_damage = self.client.post(
            f"/api/inventory/items/{item_id}/mark-damaged/",
            {"quantity": 2, "source": "custody", "notes": "تلف أثناء العمليات الميدانية"},
        )
        self.assertEqual(res_damage.status_code, 200, res_damage.data)
        item.refresh_from_db()
        self.assertEqual(item.available_quantity, 48)
        self.assertEqual(item.assigned_quantity, 0)
        self.assertEqual(item.damaged_quantity, 2)

        # Total custody records created = 3 (assigned, returned, damaged)
        self.assertEqual(CustodyRecord.objects.filter(item=item).count(), 3)

    def test_domain_filtering_armory_vs_inventory(self):
        # 1. Create armory category & weapon
        armory_cat = InventoryCategory.objects.create(
            code="rifles_test", name_ar="بنادق آلية", category_type="rifle", domain="armory"
        )
        weapon = InventoryItem.objects.create(
            category=armory_cat,
            domain="armory",
            name="بندقية كلاشينكوف AK-47",
            serial_number="AK-TEST-001",
            caliber="7.62x39",
            total_quantity=10,
            available_quantity=10,
        )

        # 2. Query items with domain=armory vs domain=inventory
        res_armory = self.client.get("/api/inventory/items/?domain=armory")
        self.assertEqual(res_armory.status_code, 200)
        armory_items = res_armory.data["results"] if "results" in res_armory.data else res_armory.data
        self.assertEqual(len(armory_items), 1)
        self.assertEqual(armory_items[0]["name"], "بندقية كلاشينكوف AK-47")
        self.assertEqual(armory_items[0]["domain_display"], "قسم التسليح والأسلحة")

        # 3. Query categories with domain=armory
        res_cats = self.client.get("/api/inventory/categories/?domain=armory")
        self.assertEqual(res_cats.status_code, 200)
        armory_cats = res_cats.data["results"] if "results" in res_cats.data else res_cats.data
        armory_cat_names = [c["name_ar"] for c in armory_cats]
        self.assertIn("بنادق آلية", armory_cat_names)

