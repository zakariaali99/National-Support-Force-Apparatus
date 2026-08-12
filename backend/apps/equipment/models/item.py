from django.db import models
from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel


EQUIPMENT_TYPE_CHOICES = [
    ("rifle", "بندقية / سلاح خفيف"),
    ("pistol", "مسدس"),
    ("machine_gun", "رشاش / سلاح متوسط"),
    ("ammo", "ذخيرة"),
    ("armor", "عتاد وتجهيزات شخصية"),
    ("other", "أخرى"),
]

ITEM_STATUS_CHOICES = [
    ("good", "صالح للاستعمال"),
    ("maintenance", "تحت الصيانة"),
    ("damaged", "تالف / غير صالح"),
    ("retired", "مستبعد / مكهن"),
]


class InventoryCategory(BaseModel):
    """Category of weapon, ammunition, or tactical gear."""

    code = models.SlugField(max_length=50, unique=True)
    name_ar = models.CharField(max_length=100)
    category_type = models.CharField(max_length=20, choices=EQUIPMENT_TYPE_CHOICES, default="rifle")
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name_ar"]
        verbose_name = "تصنيف العتاد والأسلحة"
        verbose_name_plural = "تصنيفات العتاد والأسلحة"

    def __str__(self):
        return self.name_ar


class InventoryItem(BaseModel):
    """Arms, ammunition, or equipment inventory record."""

    category = models.ForeignKey(
        InventoryCategory, on_delete=models.PROTECT, related_name="items"
    )
    name = models.CharField(max_length=150)
    serial_number = models.CharField(max_length=100, db_index=True, blank=True)
    caliber = models.CharField(max_length=50, blank=True)  # العيار (مثال: 7.62x39, 9x19)
    model_name = models.CharField(max_length=100, blank=True)
    total_quantity = models.PositiveIntegerField(default=1)
    available_quantity = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=ITEM_STATUS_CHOICES, default="good", db_index=True)
    faction = models.ForeignKey(
        "organization.Faction", null=True, blank=True, on_delete=models.SET_NULL, related_name="inventory_items"
    )
    assigned_member = models.ForeignKey(
        "members.Member", null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_inventory_items"
    )
    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    updated_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "سلاح / عتاد"
        verbose_name_plural = "سجل الأسلحة والذخائر"

    def __str__(self):
        s_num = f" ({self.serial_number})" if self.serial_number else ""
        return f"{self.name}{s_num}"
