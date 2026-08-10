from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.core.models import Role, User


class RolePermissionValidationTests(TestCase):
    def test_unknown_codename_is_rejected(self):
        role = Role(name="bad", name_ar="سيء", permissions=["not.a.real.permission"])
        with self.assertRaises(ValidationError):
            role.save()

    def test_known_codenames_are_accepted(self):
        role = Role(name="ok", name_ar="جيد", permissions=["member.view", "member.print"])
        role.save()  # should not raise
        self.assertTrue(Role.objects.filter(name="ok").exists())


class UserHasPermissionTests(TestCase):
    def setUp(self):
        self.role = Role.objects.create(
            name="editor", name_ar="محرر", permissions=["member.view", "member.edit"]
        )

    def test_user_without_roles_has_no_permissions(self):
        user = User.objects.create_user(username="nobody", password="x")
        self.assertFalse(user.has_permission("member.view"))

    def test_user_with_role_has_its_permissions_only(self):
        user = User.objects.create_user(username="editor-user", password="x")
        user.roles.add(self.role)

        self.assertTrue(user.has_permission("member.view"))
        self.assertTrue(user.has_permission("member.edit"))
        self.assertFalse(user.has_permission("member.delete"))

    def test_superuser_bypasses_role_check_entirely(self):
        user = User.objects.create_superuser(
            username="root", email="root@example.com", password="x"
        )
        self.assertTrue(user.has_permission("backup.download"))

    def test_inactive_user_never_has_permission_even_as_superuser(self):
        user = User.objects.create_superuser(
            username="disabled-root", email="root2@example.com", password="x"
        )
        user.is_active = False
        user.save()
        self.assertFalse(user.has_permission("member.view"))


class MeEndpointTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient

        self.client = APIClient()

    def test_me_reflects_effective_permissions_from_roles(self):
        role = Role.objects.create(
            name="me-test-role", name_ar="دور تجريبي", permissions=["member.view"]
        )
        user = User.objects.create_user(username="me-user", password="x")
        user.roles.add(role)
        self.client.force_authenticate(user)

        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "me-user")
        self.assertIn("member.view", response.data["permissions"])
        self.assertEqual(len(response.data["roles"]), 1)

    def test_me_requires_authentication(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, 401)
