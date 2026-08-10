from django.test import TestCase

from rest_framework.test import APIClient

from apps.core.models import Role, User
from apps.members.models import Member
from apps.organization.models import Faction, Rank


class ArabicSearchTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        role = Role.objects.create(
            name="member-viewer", name_ar="مطّلع أعضاء", permissions=["member.view"], scope="all"
        )
        self.user = User.objects.create_user(username="searcher", password="x")
        self.user.roles.add(role)
        self.client.force_authenticate(self.user)

        self.rank = Rank.objects.create(code="soldier", name_ar="جندي")
        self.faction = Faction.objects.create(code="unit-a", name_ar="الوحدة أ")

    def _create_member(self, **overrides):
        defaults = dict(
            first_name="أحمد",
            second_name="محمد",
            third_name="علي",
            last_name="الطرهوني",
            force_number="1001",
            national_number="123456789012",
            rank=self.rank,
            faction=self.faction,
        )
        defaults.update(overrides)
        return Member.objects.create(**defaults)

    def test_search_finds_alef_hamza_variant_typed_as_plain_alef(self):
        self._create_member()

        response = self.client.get("/api/members/", {"search": "احمد"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    def test_search_finds_teh_marbuta_variant(self):
        self._create_member(first_name="فاطمة", national_number="123456789013", force_number="1002")

        response = self.client.get("/api/members/", {"search": "فاطمه"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    def test_search_ignores_diacritics(self):
        self._create_member()

        response = self.client.get("/api/members/", {"search": "أَحْمَد"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    def test_search_no_match_returns_empty(self):
        self._create_member()

        response = self.client.get("/api/members/", {"search": "خالد"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)
