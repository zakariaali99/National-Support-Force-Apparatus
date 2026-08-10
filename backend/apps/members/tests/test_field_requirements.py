from django.core.management import call_command
from django.test import TestCase

from rest_framework.test import APIClient

from apps.core.models import Role, User
from apps.members.field_registry import FIELD_REGISTRY
from apps.members.models import FieldRequirement, Member
from apps.organization.models import Faction, Rank


class SyncFieldRequirementsTests(TestCase):
    def test_sync_is_idempotent(self):
        call_command("sync_field_requirements")
        first_count = FieldRequirement.objects.count()
        first_ids = set(FieldRequirement.objects.values_list("id", flat=True))

        call_command("sync_field_requirements")

        self.assertEqual(FieldRequirement.objects.count(), first_count)
        self.assertEqual(set(FieldRequirement.objects.values_list("id", flat=True)), first_ids)
        self.assertEqual(FieldRequirement.objects.count(), len(FIELD_REGISTRY))


class FieldRequirementApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.manager = User.objects.create_user(username="settings-manager", password="x")
        self.manager.roles.add(
            Role.objects.create(
                name="settings-manager-role",
                name_ar="مدير إعدادات",
                permissions=["settings.manage"],
                scope="all",
            )
        )
        self.plain_user = User.objects.create_user(username="plain-settings", password="x")

    def test_any_authenticated_user_can_read(self):
        self.client.force_authenticate(self.plain_user)
        response = self.client.get("/api/settings/field-requirements/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), len(FIELD_REGISTRY))

    def test_write_requires_settings_manage(self):
        fr = FieldRequirement.objects.get(field_key="phone")
        self.client.force_authenticate(self.plain_user)

        response = self.client.patch(f"/api/settings/field-requirements/{fr.id}/", {"is_required": True})

        self.assertEqual(response.status_code, 403)

    def test_manager_can_toggle_optional_field_required(self):
        fr = FieldRequirement.objects.get(field_key="phone")
        self.client.force_authenticate(self.manager)

        response = self.client.patch(f"/api/settings/field-requirements/{fr.id}/", {"is_required": True})

        self.assertEqual(response.status_code, 200)
        fr.refresh_from_db()
        self.assertTrue(fr.is_required)

    def test_structural_field_cannot_be_made_optional(self):
        fr = FieldRequirement.objects.get(field_key="force_number")
        self.client.force_authenticate(self.manager)

        response = self.client.patch(f"/api/settings/field-requirements/{fr.id}/", {"is_required": False})

        self.assertEqual(response.status_code, 400)

    def test_structural_field_cannot_be_hidden(self):
        fr = FieldRequirement.objects.get(field_key="rank")
        self.client.force_authenticate(self.manager)

        response = self.client.patch(f"/api/settings/field-requirements/{fr.id}/", {"is_visible": False})

        self.assertEqual(response.status_code, 400)


class MemberRequiredFieldEnforcementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        role = Role.objects.create(
            name="member-manager",
            name_ar="مدير أعضاء",
            permissions=["member.view", "member.create", "member.edit"],
            scope="all",
        )
        self.user = User.objects.create_user(username="member-manager-user", password="x")
        self.user.roles.add(role)
        self.client.force_authenticate(self.user)

        self.rank = Rank.objects.create(code="fr-rank", name_ar="رتبة")
        self.faction = Faction.objects.create(code="fr-faction", name_ar="فصيل")

    def _base_payload(self, **overrides):
        payload = dict(
            first_name="سعيد",
            second_name="عمر",
            last_name="بشير",
            force_number="FR-1",
            national_number="623456789012",
            rank=self.rank.id,
            faction=self.faction.id,
        )
        payload.update(overrides)
        return payload

    def test_optional_field_not_required_by_default(self):
        response = self.client.post("/api/members/", self._base_payload())
        self.assertEqual(response.status_code, 201, response.data)

    def test_toggling_field_required_blocks_create_without_it(self):
        phone_req = FieldRequirement.objects.get(field_key="phone")
        phone_req.is_required = True
        phone_req.save()

        response = self.client.post("/api/members/", self._base_payload())

        self.assertEqual(response.status_code, 400)
        self.assertIn("missing_required_fields", response.data)

    def test_toggling_field_required_does_not_block_unrelated_patch_on_existing_record(self):
        # Create while phone is optional.
        member_id = self.client.post("/api/members/", self._base_payload()).data["id"]

        # Now require it — the existing incomplete record must remain editable.
        phone_req = FieldRequirement.objects.get(field_key="phone")
        phone_req.is_required = True
        phone_req.save()

        response = self.client.patch(f"/api/members/{member_id}/", {"place_of_birth": "طرابلس"})

        self.assertEqual(response.status_code, 200, response.data)
        member = Member.objects.get(pk=member_id)
        self.assertEqual(member.place_of_birth, "طرابلس")

    def test_missing_required_fields_reflects_current_state(self):
        phone_req = FieldRequirement.objects.get(field_key="phone")
        phone_req.is_required = True
        phone_req.save()

        member = Member.objects.create(**{**self._base_payload(), "rank": self.rank, "faction": self.faction})

        response = self.client.get(f"/api/members/{member.id}/")

        self.assertIn("phone", response.data["missing_required_fields"])
