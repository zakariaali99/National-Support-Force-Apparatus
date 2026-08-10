from django.db import migrations

# Deprecation bridge for the old User.user_type field (see models/user.py):
# every existing user is mapped to the system role matching their current
# user_type, so authorization keeps working identically the moment code
# switches over to reading `roles` instead of `user_type`. New code should
# never branch on user_type after this migration runs.
USER_TYPE_TO_ROLE = {"admin": "admin", "supervisor": "supervisor", "member": "viewer"}


def seed_roles_and_map_users(apps, schema_editor):
    from apps.core.permissions.registry import SYSTEM_ROLE_PRESETS

    Role = apps.get_model("core", "Role")
    User = apps.get_model("core", "User")

    role_by_code = {}
    for code, preset in SYSTEM_ROLE_PRESETS.items():
        role, _ = Role.objects.update_or_create(
            name=code,
            defaults={
                "name_ar": preset["name_ar"],
                "permissions": preset["permissions"],
                "scope": preset["scope"],
                "is_system": True,
            },
        )
        role_by_code[code] = role

    for user in User.objects.all():
        role_code = USER_TYPE_TO_ROLE.get(user.user_type)
        role = role_by_code.get(role_code)
        if role:
            user.roles.add(role)


def unseed_roles(apps, schema_editor):
    from apps.core.permissions.registry import SYSTEM_ROLE_PRESETS

    Role = apps.get_model("core", "Role")
    Role.objects.filter(is_system=True, name__in=SYSTEM_ROLE_PRESETS.keys()).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_role_user_factions_user_roles"),
    ]

    operations = [
        migrations.RunPython(seed_roles_and_map_users, unseed_roles),
    ]
