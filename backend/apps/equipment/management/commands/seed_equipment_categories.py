from django.core.management.base import BaseCommand
from apps.equipment.models import InventoryCategory


DEFAULT_CATEGORIES = [
    {"code": "rifles", "name_ar": "أسلحة خفيفة وبنادق", "category_type": "rifle"},
    {"code": "pistols", "name_ar": "مسدسات", "category_type": "pistol"},
    {"code": "machine_guns", "name_ar": "أسلحة متوسطة ورشاشات", "category_type": "machine_gun"},
    {"code": "ammo_general", "name_ar": "ذخيرة متنوعة", "category_type": "ammo"},
    {"code": "tactical_gear", "name_ar": "دروع وعتاد شخصي", "category_type": "armor"},
]


class Command(BaseCommand):
    help = "Seeds default equipment and inventory categories"

    def handle(self, *args, **options):
        for item in DEFAULT_CATEGORIES:
            InventoryCategory.objects.get_or_create(
                code=item["code"],
                defaults={"name_ar": item["name_ar"], "category_type": item["category_type"]},
            )
        self.stdout.write(self.style.SUCCESS("Successfully seeded default equipment categories."))
