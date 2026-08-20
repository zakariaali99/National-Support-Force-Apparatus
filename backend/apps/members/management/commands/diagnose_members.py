"""Diagnostic command for verifying member registration subsystem and permissions."""

import os
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connection

from apps.core.models import Role, User
from apps.members.models import Member
from apps.organization.models import Faction, Rank


class Command(BaseCommand):
    help = "Diagnose member creation prerequisites (tables, ranks, factions, media permissions, roles)."

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("═══════════════════════════════════════════════════"))
        self.stdout.write(self.style.MIGRATE_HEADING("  فحص جاهزية تسجيل الأفراد (Member System Diagnostics)"))
        self.stdout.write(self.style.MIGRATE_HEADING("═══════════════════════════════════════════════════"))

        # 1. Database connection and tables check
        self.stdout.write("1. فحص اتصال قاعدة البيانات والجداول الأساسية...")
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT count(*) FROM members_member")
                count = cursor.fetchone()[0]
                self.stdout.write(self.style.SUCCESS(f"   ✓ جدول الأفراد جاهز (العدد الحالي: {count} فرد)."))
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"   ✗ فشل الوصول لجدول الأفراد: {exc}"))

        # 2. Check Ranks
        self.stdout.write("2. فحص الرتب العسكرية...")
        ranks_count = Rank.objects.filter(is_active=True).count()
        if ranks_count > 0:
            self.stdout.write(self.style.SUCCESS(f"   ✓ توجد {ranks_count} رتبة نشطة في المنظومة."))
        else:
            self.stdout.write(self.style.WARNING("   ⚠️ لا توجد رتب عسكرية نشطة! يجب تشغيل setup_system أو إضافة رتب."))

        # 3. Check Factions
        self.stdout.write("3. فحص الفصائل والإدارات...")
        factions_count = Faction.objects.filter(is_active=True).count()
        if factions_count > 0:
            self.stdout.write(self.style.SUCCESS(f"   ✓ توجد {factions_count} إدارة/فصيل نشط في المنظومة."))
        else:
            self.stdout.write(self.style.WARNING("   ⚠️ لا توجد إدارات أو فصائل نشطة! يجب تشغيل setup_system أو إضافة فصائل."))

        # 4. Check Roles with member.create permission
        self.stdout.write("4. فحص الصلاحيات والأدوار المسموح لها بإضافة أفراد...")
        roles_with_create = [
            r.name for r in Role.objects.all()
            if "member.create" in (r.permissions or []) or r.name == "admin"
        ]
        if roles_with_create:
            self.stdout.write(self.style.SUCCESS(f"   ✓ الأدوار التي تمتلك صلاحية الإضافة: {', '.join(roles_with_create)}"))
        else:
            self.stdout.write(self.style.ERROR("   ✗ لا يوجد أي دور يمتلك صلاحية member.create!"))

        # 5. Check Media Storage Directory
        self.stdout.write("5. فحص مسار تخزين الصور والملفات المرفوعة...")
        private_root = str(settings.PRIVATE_MEDIA_ROOT)
        self.stdout.write(f"   المسار: {private_root}")
        try:
            os.makedirs(private_root, exist_ok=True)
            test_file = os.path.join(private_root, ".write_test")
            with open(test_file, "w") as f:
                f.write("ok")
            os.remove(test_file)
            self.stdout.write(self.style.SUCCESS("   ✓ مسار التخزين متاح وقابل للكتابة بنجاح."))
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"   ✗ فشل الكتابة في مسار التخزين: {exc}"))

        self.stdout.write(self.style.MIGRATE_HEADING("═══════════════════════════════════════════════════"))
