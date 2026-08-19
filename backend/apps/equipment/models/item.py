from django.db import models
from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel


EQUIPMENT_TYPE_CHOICES = [
    ("rifle", "بندقية / سلاح خفيف"),
    ("pistol", "مسدس"),
    ("machine_gun", "رشاش / سلاح متوسط"),
    ("ammo", "ذخيرة"),
    ("armor", "عتاد وتجهيزات شخصية"),
    ("uniform", "مهمات وملابس عسكرية"),
    ("comm", "أجهزة اتصال ولاسلكي"),
    ("medical", "معدات طبية وإسعاف"),
    ("general", "مهمات ومخزن عام"),
    ("other", "أخرى"),
]

DOMAIN_CHOICES = [
    ("armory", "قسم التسليح والأسلحة"),
    ("inventory", "المخازن والعتاد العام"),
]

ITEM_STATUS_CHOICES = [
    ("good", "صالح للاستعمال"),
    ("maintenance", "تحت الصيانة"),
    ("damaged", "تالف / غير صالح"),
    ("retired", "مستبعد / مكهن"),
]


class InventoryCategory(BaseModel):
    """Category of weapon, ammunition, tactical gear, or warehouse equipment."""

    code = models.SlugField(max_length=50, unique=True)
    name_ar = models.CharField(max_length=100)
    domain = models.CharField(
        max_length=20, choices=DOMAIN_CHOICES, default="inventory", db_index=True, help_text="القسم التابع له التصنيف"
    )
    category_type = models.CharField(max_length=20, choices=EQUIPMENT_TYPE_CHOICES, default="general")
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name_ar"]
        verbose_name = "تصنيف العتاد والمخزن"
        verbose_name_plural = "تصنيفات العتاد والمخزن"

    def __str__(self):
        return f"{self.name_ar} ({self.get_domain_display()})"


class InventoryItem(BaseModel):
    """Arms, ammunition, tactical gear, or warehouse inventory record."""

    category = models.ForeignKey(
        InventoryCategory, on_delete=models.PROTECT, related_name="items"
    )
    domain = models.CharField(
        max_length=20, choices=DOMAIN_CHOICES, default="inventory", db_index=True, help_text="نطاق الصنف (تسليح أم مخازن عامة)"
    )
    name = models.CharField(max_length=150, help_text="اسم الصنف أو السلاح")
    item_code = models.CharField(max_length=100, db_index=True, blank=True, help_text="رقم الصنف أو الكود المخزني")
    serial_number = models.CharField(max_length=100, db_index=True, blank=True, help_text="الرقم التسلسلي")
    size_spec = models.CharField(max_length=100, blank=True, help_text="المقاس / العيار / المواصفة")
    caliber = models.CharField(max_length=50, blank=True, help_text="العيار (إن وجد)")
    model_name = models.CharField(max_length=100, blank=True, help_text="الموديل أو الطراز")

    # Inventory Quantities tracking
    total_quantity = models.PositiveIntegerField(default=1, help_text="إجمالي الكمية المملوكة")
    available_quantity = models.PositiveIntegerField(default=1, help_text="الكمية المتوفرة بالمستودع")
    assigned_quantity = models.PositiveIntegerField(default=0, help_text="الكمية المسلّمة كعهدة")
    damaged_quantity = models.PositiveIntegerField(default=0, help_text="الكمية التالفة / المستبعدة")

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
