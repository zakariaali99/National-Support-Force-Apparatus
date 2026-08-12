from django.db import migrations

ADDITIONAL_DOCUMENT_TYPES = [
    {
        "code": "academic_certificate",
        "name_ar": "المؤهل العلمي",
        "requires_expiry": False,
        "allow_multiple": True,
        "is_printable": True,
        "print_order": 40,
    },
    {
        "code": "other",
        "name_ar": "أخرى",
        "requires_expiry": False,
        "allow_multiple": True,
        "is_printable": True,
        "print_order": 50,
    },
]


def seed_additional_doc_types(apps, schema_editor):
    DocumentType = apps.get_model("organization", "DocumentType")
    for entry in ADDITIONAL_DOCUMENT_TYPES:
        defaults = dict(entry)
        code = defaults.pop("code")
        DocumentType.objects.update_or_create(
            code=code, defaults={**defaults, "is_system": True}
        )


def unseed_additional_doc_types(apps, schema_editor):
    DocumentType = apps.get_model("organization", "DocumentType")
    codes = [d["code"] for d in ADDITIONAL_DOCUMENT_TYPES]
    DocumentType.objects.filter(code__in=codes, is_system=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("organization", "0002_seed_document_types"),
    ]

    operations = [
        migrations.RunPython(seed_additional_doc_types, unseed_additional_doc_types),
    ]
