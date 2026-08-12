from django.db import migrations

FAMILY_STATUS_DOC_TYPE = {
    "code": "family_status",
    "name_ar": "الوضع العائلي / كتيب العائلة",
    "requires_expiry": False,
    "allow_multiple": True,
    "is_printable": True,
    "print_order": 25,
}


def seed_family_status_doc_type(apps, schema_editor):
    DocumentType = apps.get_model("organization", "DocumentType")
    defaults = dict(FAMILY_STATUS_DOC_TYPE)
    code = defaults.pop("code")
    DocumentType.objects.update_or_create(
        code=code, defaults={**defaults, "is_system": True}
    )


def unseed_family_status_doc_type(apps, schema_editor):
    DocumentType = apps.get_model("organization", "DocumentType")
    DocumentType.objects.filter(code="family_status", is_system=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("organization", "0003_add_academic_and_other_doc_types"),
    ]

    operations = [
        migrations.RunPython(seed_family_status_doc_type, unseed_family_status_doc_type),
    ]
