from django.test import TestCase

from rest_framework.test import APIClient

from apps.core.models import Role, User
from apps.members.models import Member
from apps.organization.models import Faction, Rank
from apps.workflow.models import Notification


class ProfileExtrasTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.rank = Rank.objects.create(code="private", name_ar="جندي")
        self.faction = Faction.objects.create(code="fx", name_ar="فصيل")
        self.member = Member.objects.create(
            first_name="سالم",
            second_name="علي",
            last_name="محمد",
            force_number="X-1",
            national_number="423456789012",
            rank=self.rank,
            faction=self.faction,
        )

        editor_role = Role.objects.create(
            name="editor",
            name_ar="محرر",
            permissions=["member.view", "member.edit", "task.assign", "vacation.approve"],
            scope="all",
        )
        self.editor = User.objects.create_user(username="editor", password="x")
        self.editor.roles.add(editor_role)

        self.assignee = User.objects.create_user(username="assignee", password="x")

        viewer_role = Role.objects.create(
            name="viewer-only", name_ar="مطّلع", permissions=["member.view"], scope="all"
        )
        self.viewer = User.objects.create_user(username="viewer-only", password="x")
        self.viewer.roles.add(viewer_role)


class MemberNoteTests(ProfileExtrasTestCase):
    def test_editor_can_create_note_and_is_recorded_as_author(self):
        self.client.force_authenticate(self.editor)

        response = self.client.post(
            "/api/member-notes/", {"member": self.member.id, "body": "ملاحظة تجريبية"}
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["author"], self.editor.id)

    def test_viewer_cannot_create_note(self):
        self.client.force_authenticate(self.viewer)

        response = self.client.post(
            "/api/member-notes/", {"member": self.member.id, "body": "ملاحظة"}
        )

        self.assertEqual(response.status_code, 403)


class MemberTaskTests(ProfileExtrasTestCase):
    def test_assigning_task_creates_notification_for_assignee(self):
        self.client.force_authenticate(self.editor)

        response = self.client.post(
            "/api/member-tasks/",
            {
                "member": self.member.id,
                "title": "تحديث الملف",
                "assigned_to": self.assignee.id,
            },
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(
            Notification.objects.filter(recipient=self.assignee, verb="task_assigned").exists()
        )

    def test_reassigning_task_notifies_new_assignee_only(self):
        self.client.force_authenticate(self.editor)
        other_assignee = User.objects.create_user(username="other-assignee", password="x")
        task_id = self.client.post(
            "/api/member-tasks/",
            {"member": self.member.id, "title": "مهمة", "assigned_to": self.assignee.id},
        ).data["id"]
        Notification.objects.all().delete()

        response = self.client.patch(
            f"/api/member-tasks/{task_id}/", {"assigned_to": other_assignee.id}
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(
            Notification.objects.filter(recipient=other_assignee, verb="task_assigned").exists()
        )
        self.assertFalse(Notification.objects.filter(recipient=self.assignee).exists())

    def test_marking_task_done_sets_completed_at(self):
        self.client.force_authenticate(self.editor)
        task_id = self.client.post(
            "/api/member-tasks/", {"member": self.member.id, "title": "مهمة"}
        ).data["id"]

        response = self.client.patch(f"/api/member-tasks/{task_id}/", {"status": "done"})

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIsNotNone(response.data["completed_at"])

    def test_creating_task_requires_task_assign_permission(self):
        self.client.force_authenticate(self.viewer)

        response = self.client.post(
            "/api/member-tasks/", {"member": self.member.id, "title": "مهمة"}
        )

        self.assertEqual(response.status_code, 403)


class MemberEvaluationTests(ProfileExtrasTestCase):
    def test_period_start_after_end_is_rejected(self):
        self.client.force_authenticate(self.editor)

        response = self.client.post(
            "/api/member-evaluations/",
            {
                "member": self.member.id,
                "period_start": "2026-06-01",
                "period_end": "2026-01-01",
                "body": "تقييم",
            },
        )

        self.assertEqual(response.status_code, 400)

    def test_valid_evaluation_records_evaluator(self):
        self.client.force_authenticate(self.editor)

        response = self.client.post(
            "/api/member-evaluations/",
            {
                "member": self.member.id,
                "period_start": "2026-01-01",
                "period_end": "2026-06-01",
                "body": "تقييم جيد",
                "score": "8.5",
            },
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["evaluator"], self.editor.id)
