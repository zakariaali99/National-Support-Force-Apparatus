"""Management command to bootstrap and initialize a fresh NSFA installation.

Idempotent: safe to run multiple times on fresh or existing databases.
Sets up:
- Standard military ranks
- Standard factions / administrative departments
- System roles and permission matrices
- Superuser / administrator account
- Standard warehouse & armament equipment categories
- Standard external units and affiliated bodies
- Standard document types
- Field requirements sync
"""

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.core.models import Role, User
from apps.core.permissions.registry import ALL_CODENAMES, SYSTEM_ROLE_PRESETS
from apps.equipment.models import InventoryCategory
from apps.organization.models import DocumentType, Faction, Rank
from apps.transportation.models import ExternalUnit


class Command(BaseCommand):
    help = "Bootstrap and initialize a fresh NSFA installation with all standard configurations, roles, ranks, categories, and admin account."

    def add_arguments(self, parser):
        parser.add_argument(
            "--admin-username",
            default="admin",
            help="Default superuser username (default: admin)",
        )
        parser.add_argument(
            "--admin-password",
            default="admin123",
            help="Default superuser password (default: admin123)",
        )
        parser.add_argument(
            "--admin-email",
            default="admin@nsfa.gov.ly",
            help="Default superuser email (default: admin@nsfa.gov.ly)",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("══════════════════════════════════════════════════════════════"))
        self.stdout.write(self.style.MIGRATE_HEADING("  بدء التهيئة الذاتية للمنظومة (NSFA System Setup & Bootstrap)"))
        self.stdout.write(self.style.MIGRATE_HEADING("══════════════════════════════════════════════════════════════"))

        # 1. Sync Field Requirements
        self.stdout.write("1. مزامنة متطلبات الحقول والتصنيفات...")
        call_command("sync_field_requirements")

        # 2. Setup Military Ranks
        self.stdout.write("2. إنشاء وتحديث الرتب العسكرية القياسية...")
        ranks_data = [
            ("FR-1", "فريق أول", 1),
            ("FR-2", "فريق", 2),
            ("FR-3", "لواء", 3),
            ("FR-4", "عميد", 4),
            ("FR-5", "عقيد", 5),
            ("FR-6", "مقدم", 6),
            ("FR-7", "رائد", 7),
            ("FR-8", "نقيب", 8),
            ("FR-9", "ملازم أول", 9),
            ("FR-10", "ملازم", 10),
            ("FR-11", "رئيس عرفاء وحدة", 11),
            ("FR-12", "رئيس عرفاء سرية", 12),
            ("FR-13", "عريف", 13),
            ("FR-14", "جندي", 14),
            ("FR-15", "فرد", 15),
        ]
        for code, name_ar, order in ranks_data:
            Rank.objects.update_or_create(
                code=code,
                defaults={"name_ar": name_ar, "order": order},
            )
        self.stdout.write(self.style.SUCCESS(f"   ✓ تم تثبيت {len(ranks_data)} رتبة عسكرية."))

        # 3. Setup Standard Factions
        self.stdout.write("3. إنشاء وتحديث الفصائل والإدارات الأساسية...")
        factions_data = [
            ("FAC-ADMIN", "الإدارة العامة للشؤون الإدارية", "الإدارة العامة والتوثيق وشؤون المنتسبين"),
            ("FAC-OPS", "شعبة العمليات والسيطرة", "إدارة العمليات الميدانية والتحركات والمأموريات"),
            ("FAC-TRANS", "قسم النقلية والآليات", "إدارة أسطول المركبات والمأموريات وحركة الآليات"),
            ("FAC-ARMS", "قسم التسليح والعهد", "مستودع الأسلحة والذخائر والعهد الميدانية"),
            ("FAC-SEC", "فصيل الحراسات والتأمين", "تأمين المقرات الحيوية والمنشآت"),
            ("FAC-ALERT", "فصيل الإنذار والتدخل السريع", "قوات التدخل والطوارئ"),
            ("FAC-PATROL", "فصيل الدوريات والاستطلاع", "الدوريات الميدانية وتأمين خطوط السير"),
            ("FAC-LOG", "فصيل الدعم اللوجستي والإمداد", "التموين والتجهيزات والمهمات العسكرية"),
        ]
        for code, name_ar, desc in factions_data:
            Faction.objects.update_or_create(
                code=code,
                defaults={"name_ar": name_ar, "description": desc},
            )
        self.stdout.write(self.style.SUCCESS(f"   ✓ تم تثبيت {len(factions_data)} فصيل وإدارة رئيسية."))

        # 4. Setup Roles & Permissions
        self.stdout.write("4. ضبط مصفوفة الصلاحيات والأدوار الإدارية...")
        created_roles = {}
        for role_key, r_info in SYSTEM_ROLE_PRESETS.items():
            role_obj, _ = Role.objects.update_or_create(
                name=role_key,
                defaults={
                    "name_ar": r_info["name_ar"],
                    "description": r_info.get("description", r_info["name_ar"]),
                    "scope": r_info.get("scope", "all" if role_key == "admin" else "own_faction"),
                    "permissions": r_info["permissions"],
                    "is_system": True,
                },
            )
            created_roles[role_key] = role_obj
        self.stdout.write(self.style.SUCCESS(f"   ✓ تم تثبيت {len(SYSTEM_ROLE_PRESETS)} دور وظيفي مع مصفوفة الصلاحيات."))

        # 5. Create/Update Administrator Account
        self.stdout.write("5. إنشاء وتأمين حساب المدير العام (Superuser)...")
        admin_user, created = User.objects.get_or_create(
            username=options["admin_username"],
            defaults={
                "email": options["admin_email"],
                "first_name": "المدير",
                "last_name": "العام",
                "is_active": True,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin_user.set_password(options["admin_password"])
        admin_user.is_active = True
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.first_name = "المدير"
        admin_user.last_name = "العام"
        admin_user.save()
        admin_user.roles.set([created_roles["admin"]])
        self.stdout.write(self.style.SUCCESS(f"   ✓ حساب المدير العام جاهز: اسم المستخدم '{options['admin_username']}'"))

        # 6. Setup Standard Equipment Categories
        self.stdout.write("6. إنشاء وتحديث تصنيفات المستودع والتسليح...")
        categories_data = [
            ("CAT-WPN-LIGHT", "أسلحة خفيفة وفردية", "armory", "weapon", "بندقية كلاشنكوف، مسدسات، بنادق قنص"),
            ("CAT-WPN-MED", "أسلحة متوسطة وثقيلة", "armory", "weapon", "رشاش دوشكا 12.7، رشاش 14.5، قواذف آر بي جي"),
            ("CAT-AMMO", "ذخائر ومقذوفات", "armory", "ammunition", "صناديق ذخيرة متنوعة ومقذوفات"),
            ("CAT-GEAR", "مهمات عسكرية وتجهيزات ميدانية", "inventory", "gear", "ستر واقية، خوذ عسكرية، دروع، جعب قتالية"),
            ("CAT-COMM", "أجهزة اتصال ولاسلكي وإلكترونيات", "inventory", "communication", "أجهزة موتورولا لاسلكية، محطات إرسال وتوجيه"),
            ("CAT-SPARE", "قطع غيار ومهمات عامة", "inventory", "general", "زيوت، بطاريات، قطع غيار لآليات ومولدات"),
        ]
        for code, name_ar, domain, cat_type, desc in categories_data:
            InventoryCategory.objects.update_or_create(
                code=code,
                defaults={
                    "name_ar": name_ar,
                    "domain": domain,
                    "category_type": cat_type,
                    "description": desc,
                },
            )
        self.stdout.write(self.style.SUCCESS(f"   ✓ تم تثبيت {len(categories_data)} تصنيف مستودع وتسليح."))

        # 7. Setup Standard External Units
        self.stdout.write("7. إنشاء وتحديث الجهات والوحدات الخارجية القياسية...")
        external_units_data = [
            ("رئاسة الأركان العامة للجيش الليبي", "MOD-HQ", "مقر رئاسة الأركان"),
            ("وزارة الدفاع", "MOD", "ديوان وزارة الدفاع"),
            ("غرفة العمليات المشتركة", "JOC", "العمليات والتنسيق المشترك"),
            ("مديرية الأمن الوطني", "NSD", "المديريات والتأمين المشترك"),
            ("جهاز حرس المنشآت النفطية والحيوية", "PFG", "تأمين المنشآت النفطية"),
            ("جهاز المخابرات الليبية", "INTEL", "التنسيق الأمني والاستخباراتي"),
        ]
        for name_ar, code, notes in external_units_data:
            ExternalUnit.objects.get_or_create(
                name_ar=name_ar,
                defaults={"code": code, "notes": notes, "is_active": True},
            )
        self.stdout.write(self.style.SUCCESS(f"   ✓ تم تثبيت {len(external_units_data)} جهة ووحدة خارجية."))

        # 8. Setup Standard Document Types
        self.stdout.write("8. إنشاء وتحديث أنواع المستندات والوثائق المرفقة...")
        doc_types_data = [
            ("personal_photo", "صورة شخصية رسمية", False, False, 1, True),
            ("national_id_paper", "البطاقة الشخصية / بطاقة الهوية", True, False, 2, True),
            ("national_number_cert", "مستخرج الرقم الوطني", False, False, 3, True),
            ("family_status_cert", "شهادة الوضع العائلي", False, False, 4, False),
            ("birth_certificate", "شهادة الميلاد", False, False, 5, True),
            ("education_cert", "شهادة المؤهل العلمي", False, True, 6, False),
            ("medical_fitness", "تقرير اللياقة الطبية", True, True, 7, False),
            ("criminal_record", "صحيفة الحالة الجنائية", True, False, 8, False),
            ("volunteer_contract", "عقد التطوع والالتزام الرسمي", False, False, 9, False),
            ("custody_receipt", "إقرار استلام عهدة عسكرية", False, True, 10, False),
            ("driving_license", "رخصة القيادة العسكرية / المدنية", True, False, 11, False),
        ]
        for code, name_ar, req_expiry, allow_mult, order, is_sys in doc_types_data:
            DocumentType.objects.update_or_create(
                code=code,
                defaults={
                    "name_ar": name_ar,
                    "requires_expiry": req_expiry,
                    "allow_multiple": allow_mult,
                    "is_printable": True,
                    "print_order": order,
                    "is_system": is_sys,
                },
            )
        self.stdout.write(self.style.SUCCESS(f"   ✓ تم تثبيت {len(doc_types_data)} نوع مستند رسمي."))

        self.stdout.write(self.style.MIGRATE_HEADING("══════════════════════════════════════════════════════════════"))
        self.stdout.write(self.style.SUCCESS("  ✓ تمت تهيئة المنظومة بالكامل بنجاح وهي جاهزة 100% للاستخدام!"))
        self.stdout.write(self.style.MIGRATE_HEADING("══════════════════════════════════════════════════════════════"))
