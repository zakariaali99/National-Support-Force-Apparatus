from django.test import TestCase

from rest_framework.test import APIClient

from apps.core.models import Role, User
from apps.members.models import Member
from apps.organization.models import Faction, Rank


class MemberApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.rank = Rank.objects.create(code="api-rank", name_ar="رتبة")
        self.faction = Faction.objects.create(code="api-faction", name_ar="فصيل")

        creator_role = Role.objects.create(
            name="member-creator",
            name_ar="منشئ أعضاء",
            permissions=["member.view", "member.create", "member.edit"],
            scope="all",
        )
        self.creator = User.objects.create_user(username="creator", password="x")
        self.creator.roles.add(creator_role)

        viewer_role = Role.objects.create(
            name="member-view-only", name_ar="مطّلع فقط", permissions=["member.view"], scope="all"
        )
        self.viewer = User.objects.create_user(username="member-viewer", password="x")
        self.viewer.roles.add(viewer_role)

    def _payload(self, **overrides):
        payload = dict(
            first_name="محمود",
            second_name="عبدالله",
            last_name="الفيتوري",
            force_number="9001",
            national_number="٥٢٣٤٥٦٧٨٩٠١٢",  # Arabic-Indic digits
            rank=self.rank.id,
            faction=self.faction.id,
        )
        payload.update(overrides)
        return payload

    def test_national_number_arabic_indic_digits_normalized_on_create(self):
        self.client.force_authenticate(self.creator)

        response = self.client.post("/api/members/", self._payload())

        self.assertEqual(response.status_code, 201, response.data)
        member = Member.objects.get(pk=response.data["id"])
        self.assertEqual(member.national_number, "5234567890" "12")

    def test_national_number_wrong_length_rejected(self):
        self.client.force_authenticate(self.creator)

        response = self.client.post("/api/members/", self._payload(national_number="123"))

        self.assertEqual(response.status_code, 400)
        self.assertIn("national_number", response.data)

    def test_viewer_without_create_permission_cannot_create_member(self):
        self.client.force_authenticate(self.viewer)

        response = self.client.post("/api/members/", self._payload())

        self.assertEqual(response.status_code, 403)

    def test_approval_status_is_not_editable_via_plain_update(self):
        self.client.force_authenticate(self.creator)
        create_response = self.client.post("/api/members/", self._payload())
        member_id = create_response.data["id"]

        response = self.client.patch(f"/api/members/{member_id}/", {"approval_status": "approved"})

        self.assertEqual(response.status_code, 200)
        member = Member.objects.get(pk=member_id)
        self.assertEqual(member.approval_status, "draft")
