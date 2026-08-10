from django.test import TestCase

from rest_framework.test import APIClient

from apps.core.models import Role, User


class RoleApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.manager = User.objects.create_user(username="role-manager", password="x")
        self.manager.roles.add(
            Role.objects.create(
                name="role-manager-role", name_ar="مدير أدوار", permissions=["roles.manage"], scope="all"
            )
        )
        self.plain_user = User.objects.create_user(username="plain-role-user", password="x")

    def test_list_requires_roles_manage(self):
        self.client.force_authenticate(self.plain_user)
        response = self.client.get("/api/roles/")
        self.assertEqual(response.status_code, 403)

    def test_manager_can_list_roles(self):
        self.client.force_authenticate(self.manager)
        response = self.client.get("/api/roles/")
        self.assertEqual(response.status_code, 200)

    def test_manager_can_create_role_with_valid_permissions(self):
        self.client.force_authenticate(self.manager)

        response = self.client.post(
            "/api/roles/",
            {
                "name": "custom-role",
                "name_ar": "دور مخصص",
                "permissions": ["member.view", "member.print"],
                "scope": "own_faction",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(Role.objects.filter(name="custom-role").exists())

    def test_create_role_with_unknown_permission_rejected(self):
        self.client.force_authenticate(self.manager)

        response = self.client.post(
            "/api/roles/",
            {"name": "bad-role", "name_ar": "دور سيء", "permissions": ["not.a.real.permission"]},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_system_role_cannot_be_deleted(self):
        system_role = Role.objects.get(name="admin")
        self.client.force_authenticate(self.manager)

        response = self.client.delete(f"/api/roles/{system_role.id}/")

        self.assertEqual(response.status_code, 403)
        self.assertTrue(Role.objects.filter(pk=system_role.pk).exists())

    def test_available_permissions_endpoint_returns_grouped_registry(self):
        self.client.force_authenticate(self.manager)

        response = self.client.get("/api/roles/permissions/")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.data) > 0)
        self.assertIn("key", response.data[0])
        self.assertIn("permissions", response.data[0])


class UserApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.manager = User.objects.create_user(username="user-manager", password="x")
        self.manager.roles.add(
            Role.objects.create(
                name="user-manager-role", name_ar="مدير مستخدمين", permissions=["users.manage"], scope="all"
            )
        )
        self.plain_user = User.objects.create_user(username="plain-user-mgmt", password="x")

    def test_list_requires_users_manage(self):
        self.client.force_authenticate(self.plain_user)
        response = self.client.get("/api/users/")
        self.assertEqual(response.status_code, 403)

    def test_manager_can_create_user_with_password(self):
        self.client.force_authenticate(self.manager)

        response = self.client.post(
            "/api/users/",
            {"username": "new-employee", "password": "StrongPass123!"},
        )

        self.assertEqual(response.status_code, 201, response.data)
        user = User.objects.get(username="new-employee")
        self.assertTrue(user.check_password("StrongPass123!"))

    def test_create_user_without_password_rejected(self):
        self.client.force_authenticate(self.manager)

        response = self.client.post("/api/users/", {"username": "no-password-user"})

        self.assertEqual(response.status_code, 400)

    def test_delete_deactivates_not_hard_deletes(self):
        target = User.objects.create_user(username="to-deactivate", password="x")
        self.client.force_authenticate(self.manager)

        response = self.client.delete(f"/api/users/{target.id}/")

        self.assertEqual(response.status_code, 204)
        target.refresh_from_db()
        self.assertFalse(target.is_active)

    def test_manager_can_assign_roles_to_user(self):
        role = Role.objects.create(name="assignable-role", name_ar="دور قابل للإسناد", permissions=[])
        target = User.objects.create_user(username="assignee", password="x")
        self.client.force_authenticate(self.manager)

        response = self.client.patch(f"/api/users/{target.id}/", {"roles": [role.id]}, format="json")

        self.assertEqual(response.status_code, 200, response.data)
        target.refresh_from_db()
        self.assertIn(role, target.roles.all())

    def test_any_authenticated_user_can_list_assignable_users(self):
        self.client.force_authenticate(self.plain_user)

        response = self.client.get("/api/users/assignable/")

        self.assertEqual(response.status_code, 200)
        usernames = {row["username"] for row in response.data}
        self.assertIn(self.plain_user.username, usernames)

    def test_assignable_users_excludes_inactive(self):
        inactive = User.objects.create_user(username="inactive-user", password="x", is_active=False)
        self.client.force_authenticate(self.plain_user)

        response = self.client.get("/api/users/assignable/")

        usernames = {row["username"] for row in response.data}
        self.assertNotIn(inactive.username, usernames)
