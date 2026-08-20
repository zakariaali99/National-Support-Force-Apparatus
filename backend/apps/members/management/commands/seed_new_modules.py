from datetime import date
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.attendance.models import ShiftRosterGroup
from apps.equipment.models import InventoryCategory, InventoryItem
from apps.members.models import Member
from apps.organization.models import Faction
from apps.transportation.models import Vehicle


class Command(BaseCommand):
    help = "Seed demo data for Transportation, Warehouse & Armament, and Attendance Rosters."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Starting demo data seeding for new modules...")

        # 1. Ensure Factions exist
        alert_faction, _ = Faction.objects.get_or_create(
            code="alert-faction", defaults={"name_ar": "فصيل الإنذار والتدخل السريع"}
        )
        guards_faction, _ = Faction.objects.get_or_create(
            code="guard-faction", defaults={"name_ar": "فصيل الحراسات والمنشآت"}
        )
        patrol_faction, _ = Faction.objects.get_or_create(
            code="patrol-faction", defaults={"name_ar": "فصيل الدوريات والاستطلاع"}
        )
        transport_faction, _ = Faction.objects.get_or_create(
            code="transport-dept", defaults={"name_ar": "قسم النقلية والحركة"}
        )
        arms_faction, _ = Faction.objects.get_or_create(
            code="arms-dept", defaults={"name_ar": "قسم التسليح والمهمات"}
        )

        members = list(Member.objects.filter(is_deleted=False))
        if not members:
            self.stdout.write(self.style.WARNING("No members found. Please run seed_system first."))
            return

        # Distribute members across factions if needed (idempotent — never
        # reshuffles members that already have a faction on re-run).
        for i, m in enumerate(members):
            if m.faction_id:
                continue
            if i % 3 == 0:
                m.faction = alert_faction
            elif i % 3 == 1:
                m.faction = guards_faction
            else:
                m.faction = patrol_faction
            m.save()

        # 1b. Seed dedicated FAC-INF members so the FAC-INF-scoped demo
        # account (viewer1) has data to see.
        self.stdout.write("Seeding FAC-INF (infantry) members...")
        from apps.organization.models import Rank
        inf_rank = Rank.objects.order_by("order").first()
        fac_inf, _ = Faction.objects.get_or_create(
            code="FAC-INF", defaults={"name_ar": "فصيل المشاة المقاتلة", "description": "قوات المشاة والعمليات الميدانية"}
        )
        fac_inf_members = [
            {
                "first_name": "فوزي", "second_name": "محمد", "third_name": "علي", "last_name": "الشريف",
                "force_number": "10301", "national_number": "119860102938",
                "date_of_birth": date(1986, 4, 9), "place_of_birth": "الزاوية", "blood_type": "O+",
                "phone": "0925011223", "join_date": date(2019, 3, 12),
                "pledges": "التعهد بالانضباط والالتزام بمهام المشاة المقاتلة والعمليات الميدانية.",
                "service_status": "active", "approval_status": "approved",
            },
            {
                "first_name": "مفتاح", "second_name": "عبد السلام", "third_name": "أحمد", "last_name": "المصراتي",
                "force_number": "10302", "national_number": "119900203948",
                "date_of_birth": date(1990, 12, 2), "place_of_birth": "مصراتة", "blood_type": "A+",
                "phone": "0914022334", "join_date": date(2020, 6, 1),
                "pledges": "التعهد بالمحافظة على العتاد والسلاح الشخصي والاستعداد الدائم للمهام.",
                "service_status": "active", "approval_status": "approved",
            },
            {
                "first_name": "رمضان", "second_name": "سالم", "third_name": "مصطفى", "last_name": "الغرياني",
                "force_number": "10303", "national_number": "119930304956",
                "date_of_birth": date(1993, 9, 25), "place_of_birth": "غريان", "blood_type": "B+",
                "phone": "0926033445", "join_date": date(2021, 4, 15),
                "pledges": "التعهد بحضور التدريبات القتالية والتواجد في الفصيل عند التكليف.",
                "service_status": "active", "approval_status": "approved",
            },
        ]
        for data in fac_inf_members:
            Member.objects.get_or_create(
                force_number=data["force_number"],
                defaults={**data, "rank": inf_rank, "faction": fac_inf},
            )

        # 2. Seed Shift Rosters
        self.stdout.write("Seeding Alert and Guard shift rotation groups...")

        # Alert Faction (4 groups: A, B, C, D - cycle 4 days)
        alert_members = [m for m in members if m.faction == alert_faction]
        for idx, (name, offset) in enumerate([
            ("نوبة الإنذار (أ)", 0),
            ("نوبة الإنذار (ب)", 1),
            ("نوبة الإنذار (ج)", 2),
            ("نوبة الإنذار (د)", 3),
        ]):
            group, _ = ShiftRosterGroup.objects.get_or_create(
                faction=alert_faction,
                name_ar=name,
                defaults={
                    "pattern": "alert_24_72",
                    "cycle_days": 4,
                    "work_days": 1,
                    "rest_days": 3,
                    "anchor_date": date(2026, 1, 1),
                    "group_offset": offset,
                    "shift_hours": Decimal("24.0"),
                },
            )
            # Assign subset of members
            assigned = [m for j, m in enumerate(alert_members) if j % 4 == idx]
            group.members.set(assigned)

        # Guard Faction (5 groups: 1, 2, 3, 4, 5 - cycle 5 days)
        guard_members = [m for m in members if m.faction == guards_faction]
        for idx, (name, offset) in enumerate([
            ("نوبة الحراسة الأولى (1)", 0),
            ("نوبة الحراسة الثانية (2)", 1),
            ("نوبة الحراسة الثالثة (3)", 2),
            ("نوبة الحراسة الرابعة (4)", 3),
            ("نوبة الحراسة الخامسة (5)", 4),
        ]):
            group, _ = ShiftRosterGroup.objects.get_or_create(
                faction=guards_faction,
                name_ar=name,
                defaults={
                    "pattern": "guard_24_96",
                    "cycle_days": 5,
                    "work_days": 1,
                    "rest_days": 4,
                    "anchor_date": date(2026, 1, 1),
                    "group_offset": offset,
                    "shift_hours": Decimal("24.0"),
                },
            )
            assigned = [m for j, m in enumerate(guard_members) if j % 5 == idx]
            group.members.set(assigned)

        # 3. Seed Inventory & Warehouse items
        self.stdout.write("Seeding Warehouse and Armament inventory items...")
        cat_rifle, _ = InventoryCategory.objects.get_or_create(
            code="rifles", defaults={"name_ar": "بنادق ورشاشات خفيفة", "category_type": "rifle"}
        )
        cat_mg, _ = InventoryCategory.objects.get_or_create(
            code="heavy-mg", defaults={"name_ar": "أسلحة ثقيلة ورشاشات متوسطة", "category_type": "machine_gun"}
        )
        cat_uniform, _ = InventoryCategory.objects.get_or_create(
            code="uniforms", defaults={"name_ar": "مهمات وملابس عسكرية", "category_type": "uniform"}
        )
        cat_comm, _ = InventoryCategory.objects.get_or_create(
            code="comm-gear", defaults={"name_ar": "أجهزة اتصال وتعيينات", "category_type": "comm"}
        )

        wpn_dshk, _ = InventoryItem.objects.get_or_create(
            serial_number="DSHK-2026-01",
            defaults={
                "category": cat_mg,
                "name": "دوشكا 12.7 مم مضادة للطيران",
                "item_code": "WPN-MG-01",
                "caliber": "12.7x108 mm",
                "total_quantity": 1,
                "available_quantity": 1,
                "status": "good",
                "faction": arms_faction,
            },
        )

        wpn_pkm, _ = InventoryItem.objects.get_or_create(
            serial_number="PKM-88992",
            defaults={
                "category": cat_rifle,
                "name": "رشاش بيكاسي PKM",
                "item_code": "WPN-PK-02",
                "caliber": "7.62x54 mm",
                "total_quantity": 1,
                "available_quantity": 1,
                "status": "good",
                "faction": arms_faction,
            },
        )

        InventoryItem.objects.get_or_create(
            item_code="UNIF-DESERT-XL",
            defaults={
                "category": cat_uniform,
                "name": "بدلة ميدان عسكرية صحراوي",
                "size_spec": "مقاس XL",
                "total_quantity": 100,
                "available_quantity": 90,
                "assigned_quantity": 10,
                "status": "good",
                "faction": arms_faction,
            },
        )

        InventoryItem.objects.get_or_create(
            item_code="UNIF-DESERT-L",
            defaults={
                "category": cat_uniform,
                "name": "بدلة ميدان عسكرية صحراوي",
                "size_spec": "مقاس L",
                "total_quantity": 120,
                "available_quantity": 115,
                "assigned_quantity": 5,
                "status": "good",
                "faction": arms_faction,
            },
        )

        InventoryItem.objects.get_or_create(
            item_code="RADIO-MOTOROLA-VHF",
            defaults={
                "category": cat_comm,
                "name": "جهاز لاسلكي موتورولا رقمي مشفر",
                "size_spec": "نظام VHF التكتيكي",
                "total_quantity": 30,
                "available_quantity": 25,
                "assigned_quantity": 5,
                "status": "good",
                "faction": transport_faction,
            },
        )

        # 4. Seed Vehicles with separate vehicle and weapon affiliation
        self.stdout.write("Seeding Vehicles fleet...")
        driver_1 = members[0] if len(members) > 0 else None
        gunner_1 = members[1] if len(members) > 1 else None
        driver_2 = members[2] if len(members) > 2 else None

        Vehicle.objects.get_or_create(
            vin_number="JTE79-LC-883391",
            defaults={
                "name": "تويوتا لاندكروزر LC79 شاص مصفح",
                "vehicle_type": "patrol",
                "plate_number": "10-9011",
                "model_year": "2024",
                "color": "بيج صحراوي",
                "status": "ready",
                "faction": patrol_faction,
                "assigned_driver": driver_1,
                "has_weapon": True,
                "mounted_weapon_name": "دوشكا 12.7 مم مضادة للطيران",
                "mounted_weapon_serial": "DSHK-2026-01",
                "mounted_weapon_item": wpn_dshk,
                "weapon_faction": arms_faction,
                "weapon_assigned_member": gunner_1,
                "notes": "مركبة استطلاع رئيسية مجهزة بكشافات ليلية ونظام ملاحة",
            },
        )

        Vehicle.objects.get_or_create(
            vin_number="JTE76-LC-449912",
            defaults={
                "name": "تويوتا لاندكروزر LC76 ستيشن",
                "vehicle_type": "patrol",
                "plate_number": "10-9012",
                "model_year": "2023",
                "color": "أسود",
                "status": "ready",
                "faction": alert_faction,
                "assigned_driver": driver_2,
                "has_weapon": True,
                "mounted_weapon_name": "رشاش بيكاسي PKM",
                "mounted_weapon_serial": "PKM-88992",
                "mounted_weapon_item": wpn_pkm,
                "weapon_faction": arms_faction,
                "weapon_assigned_member": None,
                "notes": "مجهزة للتدخل السريع",
            },
        )

        Vehicle.objects.get_or_create(
            vin_number="HIACE-AMB-2024-05",
            defaults={
                "name": "تويوتا هايس إسعاف ميداني مجهز",
                "vehicle_type": "ambulance",
                "plate_number": "10-7001",
                "model_year": "2024",
                "color": "أبيض وأحمر",
                "status": "ready",
                "faction": transport_faction,
                "has_weapon": False,
                "notes": "مجهزة بأجهزة إنعاش ونقالات ميدانية",
            },
        )

        Vehicle.objects.get_or_create(
            vin_number="COROLLA-2024-ADM-01",
            defaults={
                "name": "تويوتا كورولا صالون إدارية",
                "vehicle_type": "sedan",
                "plate_number": "10-1055",
                "model_year": "2024",
                "color": "فضي",
                "status": "ready",
                "faction": transport_faction,
                "has_weapon": False,
                "notes": "مخصصة للمهمات الإدارية والمراسلات الرسمية",
            },
        )

        self.stdout.write(self.style.SUCCESS("Successfully seeded demo data for new modules!"))
