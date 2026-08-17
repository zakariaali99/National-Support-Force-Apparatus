"""Central registry of permission codenames used by the Role engine.

These are NOT Django's contrib.auth Permission/ContentType objects — most
of the actions here aren't CRUD-on-a-single-model (member.approve,
member.print, backup.download, ...), so bending Django's model-bound
permission system to fit would mean a permission list full of fake models.
Django's built-in permissions are still used, but only for the Django
admin site itself.

Role.permissions (a JSONField list of codenames, see
apps.core.models.role) is validated against ALL_CODENAMES at save time —
a typo in a codename fails loudly instead of silently granting nothing.

Codenames are code-defined, not a DB table: they change with a code
deploy, which is the right cadence for "what actions exist in the system"
(as opposed to Rank/Faction/DocumentType, which the user maintains at
runtime through Settings).
"""

PERMISSION_GROUPS = [
    {
        "key": "members",
        "label_ar": "الأفراد",
        "permissions": {
            "member.view": "عرض الأفراد",
            "member.create": "إضافة فرد",
            "member.edit": "تعديل بيانات فرد",
            "member.delete": "حذف فرد",
            "member.approve": "اعتماد فرد جديد",
            "member.export": "تصدير بيانات الأفراد (Excel/PDF)",
            "member.print": "طباعة ملفات الأفراد",
        },
    },
    {
        "key": "documents",
        "label_ar": "المستندات",
        "permissions": {
            "document.view": "عرض المستندات",
            "document.upload": "رفع المستندات",
            "document.download_original": "تحميل النسخة الأصلية للمستند",
        },
    },
    {
        "key": "workflow",
        "label_ar": "المهام والإجازات",
        "permissions": {
            "task.assign": "إسناد المهام",
            "vacation.approve": "اعتماد طلبات الإجازة",
        },
    },
    {
        "key": "transportation",
        "label_ar": "النقلية والمركبات",
        "permissions": {
            "transportation.view": "عرض سجل المركبات والآليات",
            "transportation.manage": "إدارة وتعديل سجل المركبات والآليات",
        },
    },
    {
        "key": "equipment",
        "label_ar": "العتاد والمخازن والتسليح",
        "permissions": {
            "equipment.view": "عرض الأسلحة والعتاد والمخزن",
            "equipment.manage": "إدارة الأصناف وحركة العهد والمخزون",
        },
    },
    {
        "key": "attendance",
        "label_ar": "التمام والورديات",
        "permissions": {
            "attendance.view": "عرض التمام اليومي والشهري والورديات",
            "attendance.record": "تسجيل وإدارة التمام وحساب الخصومات",
        },
    },
    {
        "key": "organization",
        "label_ar": "الهيكل التنظيمي",
        "permissions": {
            "organization.manage": "إدارة الرتب والفصائل وأنواع المستندات",
        },
    },
    {
        "key": "settings",
        "label_ar": "الإعدادات",
        "permissions": {
            "settings.manage": "إدارة إعدادات النظام العامة",
            "users.manage": "إدارة مستخدمي النظام",
            "roles.manage": "إدارة الأدوار والصلاحيات",
        },
    },
    {
        "key": "audit_backup",
        "label_ar": "التدقيق والنسخ الاحتياطي",
        "permissions": {
            "audit.view": "عرض سجل التدقيق",
            "backup.run": "تشغيل نسخة احتياطية",
            "backup.download": "تحميل نسخة احتياطية",
        },
    },
]

# Flat {codename: arabic_label} view, derived from PERMISSION_GROUPS so the
# two never drift apart.
PERMISSIONS = {
    codename: label
    for group in PERMISSION_GROUPS
    for codename, label in group["permissions"].items()
}

ALL_CODENAMES = frozenset(PERMISSIONS)

# Seeded by the Phase 1 data migration (apps/core/migrations/..._seed_roles.py)
# as the four starting system roles. is_system=True in the Role model
# prevents these from being deleted from Settings; their permission lists
# remain fully editable by an admin like any other role.
SYSTEM_ROLE_PRESETS = {
    "admin": {
        "name_ar": "مدير النظام",
        "scope": "all",
        "permissions": sorted(ALL_CODENAMES),
    },
    "supervisor": {
        "name_ar": "مشرف",
        "scope": "own_faction",
        "permissions": sorted(
            {
                "member.view",
                "member.edit",
                "member.approve",
                "member.export",
                "member.print",
                "document.view",
                "document.upload",
                "document.download_original",
                "task.assign",
                "vacation.approve",
                "audit.view",
            }
        ),
    },
    "data_entry": {
        "name_ar": "إدخال بيانات",
        "scope": "own_faction",
        "permissions": sorted(
            {
                "member.view",
                "member.create",
                "member.edit",
                "member.print",
                "document.view",
                "document.upload",
            }
        ),
    },
    "viewer": {
        "name_ar": "مطّلع",
        "scope": "own_faction",
        "permissions": sorted({"member.view", "document.view", "member.print"}),
    },
}
