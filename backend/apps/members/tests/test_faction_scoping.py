from django.test import TestCase

from rest_framework.test import APIClient

from apps.core.models import Role, User
from apps.members.models import Member
from apps.organization.models import Faction, Rank


class FactionScopingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.rank = Rank.objects.create(code="private", name_ar="جندي")
        self.faction_a = Faction.objects.create(code="faction-a", name_ar="فصيل أ")
        self.faction_b = Faction.objects.create(code="faction-b", name_ar="فصيل ب")

        self.member_a = Member.objects.create(
            first_name="سالم",
            second_name="علي",
            last_name="أ",
            force_number="A-1",
            national_number="323456789012",
            rank=self.rank,
            faction=self.faction_a,
        )
        self.member_b = Member.objects.create(
            first_name="سالم",
            second_name="علي",
            last_name="ب",
            force_number="B-1",
            national_number="323456789013",
            rank=self.rank,
            faction=self.faction_b,
        )

        scoped_role = Role.objects.create(
            name="faction-scoped-viewer",
            name_ar="مطّلع محدود",
            permissions=["member.view"],
            scope="own_faction",
        )
        self.scoped_user = User.objects.create_user(username="scoped", password="x")
        self.scoped_user.roles.add(scoped_role)
        self.scoped_user.factions.add(self.faction_a)

        all_scope_role = Role.objects.create(
            name="all-scope-viewer", name_ar="مطّلع عام", permissions=["member.view"], scope="all"
        )
        self.unscoped_user = User.objects.create_user(username="unscoped", password="x")
        self.unscoped_user.roles.add(all_scope_role)

    def test_faction_scoped_user_only_sees_their_faction(self):
        self.client.force_authenticate(self.scoped_user)

        response = self.client.get("/api/members/")

        self.assertEqual(response.status_code, 200)
        ids = {row["id"] for row in response.data["results"]}
        self.assertEqual(ids, {self.member_a.id})

    def test_faction_scoped_user_gets_404_for_other_faction_member(self):
        self.client.force_authenticate(self.scoped_user)

        response = self.client.get(f"/api/members/{self.member_b.id}/")

        self.assertEqual(response.status_code, 404)

    def test_all_scope_user_sees_every_faction(self):
        self.client.force_authenticate(self.unscoped_user)

        response = self.client.get("/api/members/")

        ids = {row["id"] for row in response.data["results"]}
        self.assertEqual(ids, {self.member_a.id, self.member_b.id})

    def test_user_with_no_factions_assigned_sees_nothing(self):
        role = Role.objects.create(
            name="no-faction-role", name_ar="بدون فصيل", permissions=["member.view"], scope="own_faction"
        )
        user = User.objects.create_user(username="no-faction", password="x")
        user.roles.add(role)
        self.client.force_authenticate(user)

        response = self.client.get("/api/members/")

        self.assertEqual(response.data["count"], 0)
