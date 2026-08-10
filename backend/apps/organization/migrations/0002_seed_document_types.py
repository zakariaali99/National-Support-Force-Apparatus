from django.db import migrations

# Seeded, system-protected document types the Member model / print pipeline
# rely on existing (see apps.organization.models.document_type.DocumentType
# and the print-section registry added in Phase 5). New, non-system types
# can be added freely from Settings without a migration.
SYSTEM_DOCUMENT_TYPES = [
    {
        "code": "birth_certificate",
        "name_ar": "شهادة الميلاد",
        "requires_expiry": False,
        "allow_multiple": False,
        "is_printable": True,
        "print_order": 10,
    },
    {
        "code": "passport",
        "name_ar": "جواز السفر",
        "requires_expiry": True,
        "expiry_warn_days": 90,
        "allow_multiple": False,
        "is_printable": True,
        "print_order": 20,
    },
    {
        "code": "national_id_paper",
        "name_ar": "ورقة الرقم الوطني",
        "requires_expiry": False,
        "allow_multiple": False,
        "is_printable": True,
        "print_order": 30,
    },
]


def seed_document_types(apps, schema_editor):
    DocumentType = apps.get_model("organization", "DocumentType")
    for entry in SYSTEM_DOCUMENT_TYPES:
        # Copy + pop rather than mutating the module-level dict — this
        # migration can run more than once per process (tests, re-running
        # a faked migration), and popping in place would drop "code" from
        # SYSTEM_DOCUMENT_TYPES permanently after the first call.
        defaults = dict(entry)
        code = defaults.pop("code")
        DocumentType.objects.update_or_create(
            code=code, defaults={**defaults, "is_system": True}
        )


def unseed_document_types(apps, schema_editor):
    DocumentType = apps.get_model("organization", "DocumentType")
    codes = [d["code"] for d in SYSTEM_DOCUMENT_TYPES]
    DocumentType.objects.filter(code__in=codes, is_system=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("organization", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_document_types, unseed_document_types),
    ]
