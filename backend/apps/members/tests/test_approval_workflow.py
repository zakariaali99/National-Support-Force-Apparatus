from django.test import TestCase

from rest_framework.test import APIClient

from apps.core.models import Role, User
from apps.members.models import Member
from apps.organization.models import Faction, Rank
from apps.workflow.models import Notification


class ApprovalWorkflowTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.rank = Rank.objects.create(code="appr-rank", name_ar="رتبة")
        self.faction = Faction.objects.create(code="appr-faction", name_ar="فصيل")

        entry_role = Role.objects.create(
            name="data-entry-appr",
            name_ar="إدخال بيانات",
            permissions=["member.view", "member.create", "member.edit"],
            scope="own_faction",
        )
        self.entry_user = User.objects.create_user(username="entry-user", password="x")
        self.entry_user.roles.add(entry_role)
        self.entry_user.factions.add(self.faction)

        approver_role = Role.objects.create(
            name="approver-appr",
            name_ar="مشرف",
            permissions=["member.view", "member.edit", "member.approve"],
            scope="own_faction",
        )
        self.approver = User.objects.create_user(username="approver-user", password="x")
        self.approver.roles.add(approver_role)
        self.approver.factions.add(self.faction)

        self.other_approver = User.objects.create_user(username="other-approver", password="x")
        self.other_approver.roles.add(approver_role)
        self.other_approver.factions.add(self.faction)

    def _create_draft_member(self):
        self.client.force_authenticate(self.entry_user)
        response = self.client.post(
            "/api/members/",
            {
                "first_name": "مراد",
                "second_name": "عبدالله",
                "last_name": "الشريف",
                "force_number": "APR-1",
                "national_number": "823456789012",
                "rank": self.rank.id,
                "faction": self.faction.id,
            },
        )
        assert response.status_code == 201, response.data
        return Member.objects.get(pk=response.data["id"])


class SubmitTests(ApprovalWorkflowTestCase):
    def test_new_member_starts_as_draft(self):
        member = self._create_draft_member()
        self.assertEqual(member.approval_status, "draft")

    def test_submit_moves_draft_to_pending(self):
        member = self._create_draft_member()
        self.client.force_authenticate(self.entry_user)

        response = self.client.post(f"/api/members/{member.id}/submit/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["approval_status"], "pending")

    def test_submit_notifies_approvers_in_faction_excluding_submitter(self):
        member = self._create_draft_member()
        self.client.force_authenticate(self.entry_user)

        self.client.post(f"/api/members/{member.id}/submit/")

        self.assertTrue(
            Notification.objects.filter(recipient=self.approver, verb="member_submitted").exists()
        )
        self.assertTrue(
            Notification.objects.filter(recipient=self.other_approver, verb="member_submitted").exists()
        )

    def test_cannot_submit_a_member_already_pending(self):
        member = self._create_draft_member()
        self.client.force_authenticate(self.entry_user)
        self.client.post(f"/api/members/{member.id}/submit/")

        response = self.client.post(f"/api/members/{member.id}/submit/")

        self.assertEqual(response.status_code, 400)


class ApproveRejectTests(ApprovalWorkflowTestCase):
    def _submitted_member(self):
        member = self._create_draft_member()
        self.client.force_authenticate(self.entry_user)
        self.client.post(f"/api/members/{member.id}/submit/")
        return member

    def test_approve_requires_member_approve_permission(self):
        member = self._submitted_member()
        self.client.force_authenticate(self.entry_user)

        response = self.client.post(f"/api/members/{member.id}/approve/")

        self.assertEqual(response.status_code, 403)

    def test_creator_cannot_approve_own_submission(self):
        member = self._submitted_member()
        # Give the creator approve permission too, to isolate the
        # "creator cannot self-approve" rule from a plain permission check.
        self.entry_user.roles.add(
            Role.objects.create(
                name="self-approver",
                name_ar="مشرف ذاتي",
                permissions=["member.approve"],
                scope="own_faction",
            )
        )
        self.client.force_authenticate(self.entry_user)

        response = self.client.post(f"/api/members/{member.id}/approve/")

        self.assertEqual(response.status_code, 403)
        member.refresh_from_db()
        self.assertEqual(member.approval_status, "pending")

    def test_different_approver_can_approve(self):
        member = self._submitted_member()
        self.client.force_authenticate(self.approver)

        response = self.client.post(f"/api/members/{member.id}/approve/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["approval_status"], "approved")

    def test_approving_notifies_creator(self):
        member = self._submitted_member()
        self.client.force_authenticate(self.approver)

        self.client.post(f"/api/members/{member.id}/approve/")

        self.assertTrue(
            Notification.objects.filter(recipient=self.entry_user, verb="member_approved").exists()
        )

    def test_cannot_approve_a_draft_member(self):
        member = self._create_draft_member()
        self.client.force_authenticate(self.approver)

        response = self.client.post(f"/api/members/{member.id}/approve/")

        self.assertEqual(response.status_code, 400)

    def test_reject_moves_pending_to_rejected_and_notifies_creator(self):
        member = self._submitted_member()
        self.client.force_authenticate(self.approver)

        response = self.client.post(f"/api/members/{member.id}/reject/", {"reason": "بيانات ناقصة"})

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["approval_status"], "rejected")
        notification = Notification.objects.get(recipient=self.entry_user, verb="member_rejected")
        self.assertIn("بيانات ناقصة", notification.message)

    def test_rejected_member_can_be_resubmitted(self):
        member = self._submitted_member()
        self.client.force_authenticate(self.approver)
        self.client.post(f"/api/members/{member.id}/reject/")

        self.client.force_authenticate(self.entry_user)
        response = self.client.post(f"/api/members/{member.id}/submit/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["approval_status"], "pending")

    def test_approval_status_still_not_settable_via_plain_patch(self):
        member = self._submitted_member()
        self.client.force_authenticate(self.approver)

        response = self.client.patch(f"/api/members/{member.id}/", {"approval_status": "approved"})

        self.assertEqual(response.status_code, 200)
        member.refresh_from_db()
        self.assertEqual(member.approval_status, "pending")
