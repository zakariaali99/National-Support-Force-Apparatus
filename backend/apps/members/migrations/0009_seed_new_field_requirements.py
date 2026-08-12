from django.db import migrations
from apps.members.field_registry import FIELD_REGISTRY


def seed_new_field_requirements(apps, schema_editor):
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


def unseed_new_field_requirements(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("members", "0008_add_profile_residence_and_location_fields"),
    ]

    operations = [
        migrations.RunPython(seed_new_field_requirements, unseed_new_field_requirements),
    ]
