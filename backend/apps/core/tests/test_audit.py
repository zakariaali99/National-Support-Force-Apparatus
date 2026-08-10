from django.test import TestCase

from rest_framework.test import APIClient

from apps.core.activity import log_activity
from apps.core.models import ActivityLog, Role, User
from apps.organization.models import Faction


class ActivityLogApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.viewer_role = Role.objects.create(
            name="audit-viewer", name_ar="مطّلع تدقيق", permissions=["audit.view"], scope="all"
        )
        self.viewer = User.objects.create_user(username="audit-viewer-user", password="x")
        self.viewer.roles.add(self.viewer_role)

        self.plain_user = User.objects.create_user(username="plain-audit-user", password="x")

        log_activity(actor=self.plain_user, action="document_download", description="test entry")

    def test_requires_audit_view_permission(self):
        self.client.force_authenticate(self.plain_user)

        response = self.client.get("/api/audit/activity/")

        self.assertEqual(response.status_code, 403)

    def test_viewer_can_list_activity(self):
        self.client.force_authenticate(self.viewer)

        response = self.client.get("/api/audit/activity/")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data["count"], 1)

    def test_activity_log_is_read_only(self):
        self.client.force_authenticate(self.viewer)

        response = self.client.post("/api/audit/activity/", {"action": "fake"})

        self.assertEqual(response.status_code, 405)


class LoginFailedLoggingTests(TestCase):
    def test_failed_login_writes_activity_log(self):
        client = APIClient()

        client.post("/api/auth/login/", {"username": "nobody", "password": "wrong"})

        self.assertTrue(ActivityLog.objects.filter(action="login_failed").exists())

    def test_successful_login_does_not_write_login_failed(self):
        User.objects.create_user(username="real-user", password="RealPass123!")
        client = APIClient()

        response = client.post("/api/auth/login/", {"username": "real-user", "password": "RealPass123!"})

        self.assertEqual(response.status_code, 200)
        self.assertFalse(ActivityLog.objects.filter(action="login_failed").exists())


class HistoryViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        role = Role.objects.create(
            name="audit-history-viewer",
            name_ar="مطّلع سجل",
            permissions=["audit.view", "organization.manage"],
            scope="all",
        )
        self.user = User.objects.create_user(username="history-user", password="x")
        self.user.roles.add(role)
        self.client.force_authenticate(self.user)

    def test_history_reflects_field_change(self):
        faction = Faction.objects.create(code="hist-fac", name_ar="فصيل قديم")
        faction.name_ar = "فصيل جديد"
        faction.save()

        response = self.client.get(f"/api/audit/history/?model=faction&id={faction.id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        latest = response.data[0]
        changed_fields = {c["field"] for c in latest["changes"]}
        self.assertIn("name_ar", changed_fields)

    def test_unknown_model_key_is_400(self):
        response = self.client.get("/api/audit/history/?model=not-a-model&id=1")

        self.assertEqual(response.status_code, 400)

    def test_requires_audit_view_permission(self):
        plain = User.objects.create_user(username="no-audit-perm", password="x")
        self.client.force_authenticate(plain)
        faction = Faction.objects.create(code="hist-fac-2", name_ar="فصيل")

        response = self.client.get(f"/api/audit/history/?model=faction&id={faction.id}")

        self.assertEqual(response.status_code, 403)
