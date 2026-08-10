import random
from datetime import date
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction

from apps.core.models import User, Role
from apps.organization.models import Rank, Faction, DocumentType
from apps.members.models import Member

class Command(BaseCommand):
    help = "Seed the SQLite database with realistic ranks, factions, roles, users, and member records."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Starting system seeding...")

        # 1. Sync Field Requirements first
        self.stdout.write("Syncing field requirements...")
        call_command("sync_field_requirements")

        # 2. Get standard roles
        admin_role = Role.objects.get(name="admin")
        supervisor_role = Role.objects.get(name="supervisor")
        data_entry_role = Role.objects.get(name="data_entry")
        viewer_role = Role.objects.get(name="viewer")

        # 3. Create Superuser / Admin
        self.stdout.write("Creating superuser 'admin'...")
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@nsfa.gov.ly",
                "first_name": "أحمد",
                "last_name": "الورفلي",
                "is_active": True,
                "is_staff": True,
                "is_superuser": True,
            }
        )
        if created or not admin_user.check_password("admin123"):
            admin_user.set_password("admin123")
            admin_user.save()
        admin_user.roles.set([admin_role])

        # 4. Create Ranks
        self.stdout.write("Creating military ranks...")
        ranks_data = [
            ("FR-1", "فريق أول", 1),
            ("FR-2", "لواء", 2),
            ("FR-3", "عميد", 3),
            ("FR-4", "عقيد", 4),
            ("FR-5", "مقدم", 5),
            ("FR-6", "رائد", 6),
            ("FR-7", "نقيب", 7),
            ("FR-8", "ملازم أول", 8),
            ("FR-9", "ملازم", 9),
            ("FR-10", "رئيس عرفاء", 10),
            ("FR-11", "عريف", 11),
            ("FR-12", "جندي", 12),
        ]
        ranks = []
        for code, name_ar, order in ranks_data:
            rank, _ = Rank.objects.update_or_create(
                code=code,
                defaults={"name_ar": name_ar, "order": order}
            )
            ranks.append(rank)

        # 5. Create Factions
        self.stdout.write("Creating factions (departments)...")
        factions_data = [
            ("FAC-CMD", "فصيل القيادة والسيطرة", "القيادة الرئيسية والتحكم"),
            ("FAC-SUPP", "فصيل الإسناد الناري", "المدفعية والدعم الناري"),
            ("FAC-LOG", "فصيل الدعم اللوجستي", "التموين والنقل والصيانة"),
            ("FAC-PROT", "فصيل الحماية والحراسة", "تأمين المقرات والمنشآت"),
            ("FAC-INF", "فصيل المشاة المقاتلة", "قوات المشاة والعمليات الميدانية"),
            ("FAC-TRN", "فصيل التدريب والتأهيل", "إعداد وتدريب القوة"),
        ]
        factions = {}
        for code, name_ar, desc in factions_data:
            faction, _ = Faction.objects.update_or_create(
                code=code,
                defaults={"name_ar": name_ar, "description": desc}
            )
            factions[code] = faction

        # 6. Create Support Users
        self.stdout.write("Creating standard staff accounts...")
        # Supervisor
        sup_user, _ = User.objects.get_or_create(
            username="supervisor1",
            defaults={
                "email": "supervisor@nsfa.gov.ly",
                "first_name": "سالم",
                "last_name": "الترهوني",
                "is_active": True,
                "is_staff": True,
            }
        )
        sup_user.set_password("Supervisor123!")
        sup_user.save()
        sup_user.roles.set([supervisor_role])
        sup_user.factions.set([factions["FAC-CMD"], factions["FAC-PROT"]])

        # Data Entry
        de_user, _ = User.objects.get_or_create(
            username="dataentry1",
            defaults={
                "email": "dataentry@nsfa.gov.ly",
                "first_name": "خالد",
                "last_name": "الزنتاني",
                "is_active": True,
                "is_staff": True,
            }
        )
        de_user.set_password("DataEntry123!")
        de_user.save()
        de_user.roles.set([data_entry_role])
        de_user.factions.set([factions["FAC-LOG"], factions["FAC-INF"]])

        # Viewer
        v_user, _ = User.objects.get_or_create(
            username="viewer1",
            defaults={
                "email": "viewer@nsfa.gov.ly",
                "first_name": "عمر",
                "last_name": "السويحلي",
                "is_active": True,
                "is_staff": False,
            }
        )
        v_user.set_password("Viewer123!")
        v_user.save()
        v_user.roles.set([viewer_role])
        v_user.factions.set([factions["FAC-INF"]])

        # 7. Create Members
        self.stdout.write("Seeding realistic member profiles...")
        members_data = [
            {
                "first_name": "أحمد", "second_name": "علي", "third_name": "محمد", "last_name": "الورفلي",
                "force_number": "10029", "national_number": "119850192837",
                "date_of_birth": date(1985, 3, 14), "place_of_birth": "طرابلس", "blood_type": "O+",
                "phone": "0912345678", "join_date": date(2018, 5, 1),
                "pledges": "التعهد بالالتزام بالقوانين العسكرية وحماية الوطن وممتلكات الجهاز والمحافظة على سرية المعلومات.",
                "service_status": "active", "approval_status": "approved",
                "rank": ranks[3], "faction": factions["FAC-CMD"]
            },
            {
                "first_name": "سالم", "second_name": "عبد الله", "third_name": "عمر", "last_name": "الترهوني",
                "force_number": "10041", "national_number": "119880293847",
                "date_of_birth": date(1988, 7, 22), "place_of_birth": "ترهونة", "blood_type": "A+",
                "phone": "0921234567", "join_date": date(2019, 10, 15),
                "pledges": "تعهد بالانضباط وحضور الطوابير الصباحية والالتزام بالأوامر الصادرة عن القيادة.",
                "service_status": "active", "approval_status": "approved",
                "rank": ranks[4], "faction": factions["FAC-PROT"]
            },
            {
                "first_name": "محمد", "second_name": "الهادي", "third_name": "مصطفى", "last_name": "بن علي",
                "force_number": "10065", "national_number": "119900384726",
                "date_of_birth": date(1990, 11, 5), "place_of_birth": "بنغازي", "blood_type": "B+",
                "phone": "0919876543", "join_date": date(2020, 2, 20),
                "pledges": "المحافظة على العتاد العسكري المخصص للمهام والعمليات الميدانية واللوجستية.",
                "service_status": "active", "approval_status": "approved",
                "rank": ranks[6], "faction": factions["FAC-LOG"]
            },
            {
                "first_name": "خالد", "second_name": "مسعود", "third_name": "سعيد", "last_name": "الزنتاني",
                "force_number": "10082", "national_number": "119920492837",
                "date_of_birth": date(1992, 5, 18), "place_of_birth": "الزنتان", "blood_type": "AB+",
                "phone": "0941234567", "join_date": date(2020, 8, 1),
                "pledges": "التعهد بالانضباط وحضور دورات التأهيل والتدريب القتالي المستمر.",
                "service_status": "active", "approval_status": "approved",
                "rank": ranks[7], "faction": factions["FAC-TRN"]
            },
            {
                "first_name": "صلاح", "second_name": "عمر", "third_name": "عثمان", "last_name": "القذافي",
                "force_number": "10103", "national_number": "119830582736",
                "date_of_birth": date(1983, 1, 30), "place_of_birth": "سرت", "blood_type": "O-",
                "phone": "0915556677", "join_date": date(2017, 3, 10),
                "pledges": "تعهد بحماية المنشآت الحيوية التابعة للدولة والدفاع عنها ضد أي تهديد.",
                "service_status": "active", "approval_status": "approved",
                "rank": ranks[2], "faction": factions["FAC-CMD"]
            },
            {
                "first_name": "عبد الرحمن", "second_name": "مفتاح", "third_name": "ناجي", "last_name": "الطرابلسي",
                "force_number": "10122", "national_number": "119950682734",
                "date_of_birth": date(1995, 9, 12), "place_of_birth": "طرابلس", "blood_type": "A-",
                "phone": "0926667788", "join_date": date(2021, 6, 15),
                "pledges": "تعهد بالعمل بروح الفريق الواحد في العمليات العسكرية والإنسانية الخاصة بالقوى المساندة.",
                "service_status": "on_leave", "approval_status": "approved",
                "rank": ranks[8], "faction": factions["FAC-INF"]
            },
            {
                "first_name": "أبوبكر", "second_name": "السنوسي", "third_name": "مسعود", "last_name": "الغرياني",
                "force_number": "10145", "national_number": "119910738274",
                "date_of_birth": date(1991, 12, 25), "place_of_birth": "غريان", "blood_type": "B-",
                "phone": "0917778899", "join_date": date(2020, 1, 5),
                "pledges": "الالتزام التام بقوانين الأمن والسلامة أثناء التعامل مع الأسلحة والذخائر.",
                "service_status": "active", "approval_status": "pending",
                "rank": ranks[5], "faction": factions["FAC-SUPP"]
            },
            {
                "first_name": "فتحي", "second_name": "عبد السلام", "third_name": "محمد", "last_name": "حليم",
                "force_number": "10168", "national_number": "119860827364",
                "date_of_birth": date(1986, 4, 8), "place_of_birth": "مصراتة", "blood_type": "O+",
                "phone": "0918889900", "join_date": date(2019, 3, 1),
                "pledges": "التعهد بالامتثال الفوري لأوامر الاستدعاء لحالات الطوارئ والتعبئة العامة.",
                "service_status": "suspended", "approval_status": "approved",
                "rank": ranks[5], "faction": factions["FAC-INF"]
            },
            {
                "first_name": "عمر", "second_name": "مصطفى", "third_name": "عبد اللطيف", "last_name": "السويحلي",
                "force_number": "10190", "national_number": "119890982736",
                "date_of_birth": date(1989, 10, 17), "place_of_birth": "مصراتة", "blood_type": "A+",
                "phone": "0929990011", "join_date": date(2018, 12, 1),
                "pledges": "تعهد انضباط وأخلاق عسكرية وتعهد بعدم ممارسة أي عمل سياسي أو حزبي أثناء الخدمة.",
                "service_status": "retired", "approval_status": "approved",
                "rank": ranks[10], "faction": factions["FAC-TRN"]
            },
            {
                "first_name": "طارق", "second_name": "المهدي", "third_name": "الهادي", "last_name": "المنتصر",
                "force_number": "10211", "national_number": "119940182736",
                "date_of_birth": date(1994, 2, 28), "place_of_birth": "الخمس", "blood_type": "B+",
                "phone": "0911112233", "join_date": date(2021, 1, 10),
                "pledges": "تعهد بالدفاع عن حدود الوطن ومنشآته النفطية والحيوية عند التكليف المباشر.",
                "service_status": "active", "approval_status": "draft",
                "rank": ranks[11], "faction": factions["FAC-PROT"]
            },
            {
                "first_name": "جمال", "second_name": "صالح", "third_name": "رمضان", "last_name": "الباروني",
                "force_number": "10232", "national_number": "119870283746",
                "date_of_birth": date(1987, 6, 14), "place_of_birth": "جادو", "blood_type": "AB-",
                "phone": "0944445566", "join_date": date(2019, 7, 1),
                "pledges": "التعهد بالحفاظ على السلوك القويم والسمعة الطيبة لمنتسبي الجهاز الوطني.",
                "service_status": "active", "approval_status": "approved",
                "rank": ranks[9], "faction": factions["FAC-LOG"]
            },
            {
                "first_name": "عادل", "second_name": "مفتاح", "third_name": "إبراهيم", "last_name": "القره مانلي",
                "force_number": "10255", "national_number": "119930382746",
                "date_of_birth": date(1993, 8, 21), "place_of_birth": "طرابلس", "blood_type": "O+",
                "phone": "0913334455", "join_date": date(2020, 11, 1),
                "pledges": "التعهد بالعمل والتواجد في أي فصيل أو منطقة عسكرية تحددها قيادة الجهاز.",
                "service_status": "active", "approval_status": "approved",
                "rank": ranks[11], "faction": factions["FAC-INF"]
            }
        ]

        for m_data in members_data:
            Member.objects.get_or_create(
                force_number=m_data["force_number"],
                defaults=m_data
            )

        self.stdout.write(self.style.SUCCESS("System seeded successfully! Ready for verification."))
