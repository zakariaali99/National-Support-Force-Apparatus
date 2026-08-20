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
        "key": "armory",
        "label_ar": "منظومة التسليح والأسلحة والذخائر",
        "permissions": {
            "armory.view": "عرض سجل الأسلحة والذخائر والتسليح",
            "armory.manage": "إدارة وصرف وتكهين الأسلحة والذخائر وحركة العهد",
        },
    },
    {
        "key": "equipment",
        "label_ar": "المخازن والمستودع والعهد العامة",
        "permissions": {
            "equipment.view": "عرض الأصناف والعتاد والمستودع العام",
            "equipment.manage": "إدارة الأصناف والمستودع العام وصرف العهد",
        },
    },
    {
        "key": "transportation",
        "label_ar": "النقليات والحركة والمركبات",
        "permissions": {
            "transportation.view": "عرض سجل المركبات والآليات",
            "transportation.manage": "إدارة وتعديل سجل المركبات والآليات وتكليف السائقين",
        },
    },
    {
        "key": "attendance",
        "label_ar": "التمام والمناوبات والورديات",
        "permissions": {
            "attendance.view": "عرض التمام اليومي والشهري والورديات",
            "attendance.record": "تسجيل وإدارة التمام والورديات وحساب الخصومات",
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
        "label_ar": "الإعدادات وإدارة النظام",
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
            "audit.view": "عرض سجل التدقيق والعمليات",
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
# as the starting system roles. is_system=True in the Role model
# prevents these from being deleted from Settings; their permission lists
# remain fully editable by an admin like any other role.
SYSTEM_ROLE_PRESETS = {
    "admin": {
        "name_ar": "مدير النظام العام",
        "scope": "all",
        "permissions": sorted(ALL_CODENAMES),
    },
    "supervisor": {
        "name_ar": "مشرف عام / قائد ميداني",
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
                "attendance.view",
                "attendance.record",
                "armory.view",
                "armory.manage",
                "equipment.view",
                "equipment.manage",
                "transportation.view",
                "transportation.manage",
                "audit.view",
            }
        ),
    },
    "armory_officer": {
        "name_ar": "مسؤول التسليح والأسلحة والذخائر",
        "scope": "own_faction",
        "permissions": sorted(
            {
                "armory.view",
                "armory.manage",
                "member.view",
                "member.print",
                "document.view",
                "audit.view",
            }
        ),
    },
    "inventory_officer": {
        "name_ar": "أمين المستودع والمخازن العامة",
        "scope": "own_faction",
        "permissions": sorted(
            {
                "equipment.view",
                "equipment.manage",
                "member.view",
                "member.print",
                "document.view",
                "audit.view",
            }
        ),
    },
    "transport_officer": {
        "name_ar": "مسؤول النقليات والحركة والآليات",
        "scope": "own_faction",
        "permissions": sorted(
            {
                "transportation.view",
                "transportation.manage",
                "member.view",
                "member.print",
                "document.view",
                "audit.view",
            }
        ),
    },
    "attendance_officer": {
        "name_ar": "مسؤول التمام والانضباط والمناوبات",
        "scope": "own_faction",
        "permissions": sorted(
            {
                "attendance.view",
                "attendance.record",
                "member.view",
                "member.print",
                "document.view",
            }
        ),
    },
    "hr_officer": {
        "name_ar": "مسؤول شؤون الأفراد والمنتسبين",
        "scope": "own_faction",
        "permissions": sorted(
            {
                "member.view",
                "member.create",
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
        "name_ar": "مدخل بيانات عام",
        "scope": "own_faction",
        "permissions": sorted(
            {
                "member.view",
                "member.create",
                "member.edit",
                "member.print",
                "document.view",
                "document.upload",
                "attendance.view",
                "attendance.record",
                "armory.view",
                "equipment.view",
                "transportation.view",
            }
        ),
    },
    "viewer": {
        "name_ar": "مطّلع / مراقب",
        "scope": "own_faction",
        "permissions": sorted(
            {
                "member.view",
                "document.view",
                "member.print",
                "attendance.view",
                "armory.view",
                "equipment.view",
                "transportation.view",
            }
        ),
    },
}
