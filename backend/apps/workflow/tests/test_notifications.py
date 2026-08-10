from django.test import TestCase

from rest_framework.test import APIClient

from apps.core.models import User
from apps.workflow.models import Notification


class NotificationApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="notif-user", password="x")
        self.other_user = User.objects.create_user(username="other-user", password="x")
        self.notification = Notification.objects.create(
            recipient=self.user, verb="task_assigned", message="تم إسناد مهمة"
        )
        Notification.objects.create(recipient=self.other_user, verb="task_assigned", message="مهمة أخرى")

    def test_list_only_returns_own_notifications(self):
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/notifications/")

        self.assertEqual(response.status_code, 200)
        ids = {row["id"] for row in response.data["results"]}
        self.assertEqual(ids, {self.notification.id})

    def test_unread_count(self):
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/notifications/unread_count/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    def test_mark_read(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(f"/api/notifications/{self.notification.id}/mark_read/")

        self.assertEqual(response.status_code, 200)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_cannot_mark_another_users_notification_read(self):
        self.client.force_authenticate(self.other_user)

        response = self.client.post(f"/api/notifications/{self.notification.id}/mark_read/")

        self.assertEqual(response.status_code, 404)

    def test_mark_all_read(self):
        Notification.objects.create(recipient=self.user, verb="task_assigned", message="مهمة ثانية")
        self.client.force_authenticate(self.user)

        response = self.client.post("/api/notifications/mark_all_read/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Notification.objects.filter(recipient=self.user, is_read=False).count(), 0)
