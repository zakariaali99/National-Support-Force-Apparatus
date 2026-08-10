"""Canonical registry of Member fields that Settings > Field Requirements
can toggle required/visible for.

This is the source of truth for which fields EXIST and their type/label;
apps.members.models.field_requirement.FieldRequirement only stores mutable
is_required/is_visible/order OVERRIDES on top of it — the two are kept in
sync by management/commands/sync_field_requirements.py (idempotent, safe
to run on every deploy) and the data migration that seeds it once.

Structural fields (lockable=False) are the ones the rest of the system
already assumes exist and are non-empty — force_number/national_number
uniqueness, rank/faction FKs, search — so their required-ness can never be
turned off from Settings. See FieldRequirementSerializer for enforcement.
"""

FIELD_REGISTRY = [
    {"key": "first_name", "label_ar": "الاسم الأول", "type": "text", "default_required": True, "lockable": False},
    {"key": "second_name", "label_ar": "اسم الأب", "type": "text", "default_required": True, "lockable": False},
    {"key": "third_name", "label_ar": "اسم الجد", "type": "text", "default_required": False, "lockable": True},
    {"key": "last_name", "label_ar": "اللقب", "type": "text", "default_required": True, "lockable": False},
    {"key": "photo", "label_ar": "الصورة الشخصية", "type": "image", "default_required": False, "lockable": True},
    {"key": "force_number", "label_ar": "الرقم الحربي", "type": "text", "default_required": True, "lockable": False},
    {
        "key": "national_number",
        "label_ar": "الرقم الوطني",
        "type": "text",
        "default_required": True,
        "lockable": False,
    },
    {
        "key": "date_of_birth",
        "label_ar": "تاريخ الميلاد",
        "type": "date",
        "default_required": False,
        "lockable": True,
    },
    {
        "key": "place_of_birth",
        "label_ar": "مكان الميلاد",
        "type": "text",
        "default_required": False,
        "lockable": True,
    },
    {"key": "blood_type", "label_ar": "فصيلة الدم", "type": "select", "default_required": False, "lockable": True},
    {"key": "rank", "label_ar": "الرتبة", "type": "select", "default_required": True, "lockable": False},
    {"key": "faction", "label_ar": "الفصيل", "type": "select", "default_required": True, "lockable": False},
    {"key": "phone", "label_ar": "رقم الهاتف", "type": "text", "default_required": False, "lockable": True},
    {"key": "pledges", "label_ar": "التعهدات", "type": "textarea", "default_required": False, "lockable": True},
    {
        "key": "join_date",
        "label_ar": "تاريخ الالتحاق",
        "type": "date",
        "default_required": False,
        "lockable": True,
    },
]

FIELD_KEYS = {f["key"] for f in FIELD_REGISTRY}
FIELD_BY_KEY = {f["key"]: f for f in FIELD_REGISTRY}


def get_requirement_overrides():
    """{field_key: FieldRequirement} for every row currently in the table.
    Local import — this module must stay importable before the app
    registry is ready (it's imported from migrations).
    """
    from apps.members.models import FieldRequirement

    return {fr.field_key: fr for fr in FieldRequirement.objects.all()}


def is_field_required(field_key, overrides=None):
    if overrides is None:
        overrides = get_requirement_overrides()
    override = overrides.get(field_key)
    if override is not None:
        return override.is_required
    return FIELD_BY_KEY.get(field_key, {}).get("default_required", False)
