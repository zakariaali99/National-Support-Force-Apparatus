from django.db import migrations


def sync_system_roles(apps, schema_editor):
    from apps.core.permissions.registry import SYSTEM_ROLE_PRESETS

    Role = apps.get_model("core", "Role")

    for code, preset in SYSTEM_ROLE_PRESETS.items():
        Role.objects.update_or_create(
            name=code,
            defaults={
                "name_ar": preset["name_ar"],
                "permissions": preset["permissions"],
                "scope": preset["scope"],
                "is_system": True,
            },
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0005_activitylog_backuprecord_scheduledjobrun"),
    ]

    operations = [
        migrations.RunPython(sync_system_roles, noop_reverse),
    ]
