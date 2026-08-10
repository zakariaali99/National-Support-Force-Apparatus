from django.db import migrations


def seed_field_requirements(apps, schema_editor):
    from apps.members.field_registry import FIELD_REGISTRY

    FieldRequirement = apps.get_model("members", "FieldRequirement")
    for index, field in enumerate(FIELD_REGISTRY):
        FieldRequirement.objects.get_or_create(
            field_key=field["key"],
            defaults={
                "is_required": field["default_required"],
                "is_visible": True,
                "order": index,
            },
        )


def unseed_field_requirements(apps, schema_editor):
    from apps.members.field_registry import FIELD_REGISTRY

    FieldRequirement = apps.get_model("members", "FieldRequirement")
    keys = [f["key"] for f in FIELD_REGISTRY]
    FieldRequirement.objects.filter(field_key__in=keys).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("members", "0002_fieldrequirement"),
    ]

    operations = [
        migrations.RunPython(seed_field_requirements, unseed_field_requirements),
    ]
