"""Permission-matrix test: for every (system role, list endpoint) pair,
asserts 200 if that role's SYSTEM_ROLE_PRESETS permissions include the
endpoint's required codename, 403 otherwise. Reads expectations from the
registry itself rather than hardcoding them, so this test stays correct
(and keeps failing loudly) if a future change narrows or widens what a
preset role can see — see PLAN.md's Verification checklist: "role ×
endpoint permission matrix (200/403)".

Endpoint status codes only — response *content* (faction scoping, list
filtering) is covered by each feature's own tests (test_faction_scoping.py
etc.), not duplicated here.
"""

from django.test import TestCase

from rest_framework.test import APIClient

from apps.core.models import Role, User
from apps.core.permissions.registry import SYSTEM_ROLE_PRESETS

# (url, required permission codename or None for "any authenticated user")
ENDPOINTS = [
    ("/api/members/", "member.view"),
    ("/api/member-documents/", "document.view"),
    ("/api/member-notes/", "member.view"),
    ("/api/member-tasks/", "member.view"),
    ("/api/member-evaluations/", "member.view"),
    ("/api/vacation-requests/", "member.view"),
    ("/api/vacation-transactions/", "member.view"),
    ("/api/notifications/", None),
    ("/api/roles/", "roles.manage"),
    ("/api/users/", "users.manage"),
    ("/api/ranks/", None),
    ("/api/factions/", None),
    ("/api/document-types/", None),
    ("/api/settings/field-requirements/", None),
    ("/api/audit/activity/", "audit.view"),
    ("/api/backups/", "backup.run"),
    ("/api/reports/sections/", None),
]


class PermissionMatrixTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.users = {}
        for role_name, preset in SYSTEM_ROLE_PRESETS.items():
            role = Role.objects.create(
                name=f"matrix-{role_name}",
                name_ar=preset["name_ar"],
                permissions=preset["permissions"],
                scope=preset["scope"],
            )
            user = User.objects.create_user(username=f"matrix-{role_name}", password="x")
            user.roles.add(role)
            cls.users[role_name] = user

    def test_matrix(self):
        client = APIClient()
        failures = []

        for role_name, user in self.users.items():
            permissions = set(SYSTEM_ROLE_PRESETS[role_name]["permissions"])
            client.force_authenticate(user)

            for url, required in ENDPOINTS:
                response = client.get(url)
                expected_ok = required is None or required in permissions
                actual_ok = response.status_code == 200

                if expected_ok != actual_ok:
                    failures.append(
                        f"{role_name} @ {url} (needs {required!r}): "
                        f"expected {'200' if expected_ok else '403'}, got {response.status_code}"
                    )

        self.assertEqual(failures, [], "\n".join(failures))
