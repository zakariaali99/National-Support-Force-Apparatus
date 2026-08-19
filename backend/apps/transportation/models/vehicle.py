from django.db import models
from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel


VEHICLE_TYPE_CHOICES = [
    ("patrol", "دورية / استطلاع"),
    ("armored", "مصفحة"),
    ("pickup", "بيك آب / دفع رباعي"),
    ("transport", "نقل أفراد"),
    ("truck", "شاحنة نقل / إمداد"),
    ("ambulance", "إسعاف"),
    ("sedan", "صالون / إدارية"),
    ("other", "أخرى"),
]

VEHICLE_STATUS_CHOICES = [
    ("ready", "جاهزة للخدمة"),
    ("maintenance", "تحت الصيانة"),
    ("damaged", "معطلة"),
    ("retired", "خارج الخدمة"),
]


class Vehicle(BaseModel):
    """Transportation Department vehicle record with separate vehicle and mounted-weapon affiliation."""

    name = models.CharField(max_length=150, help_text="اسم أو طراز المركبة")
    vehicle_type = models.CharField(
        max_length=30, choices=VEHICLE_TYPE_CHOICES, default="pickup", db_index=True
    )
    vin_number = models.CharField(
        max_length=100, db_index=True, help_text="رقم الهيكل / VIN"
    )
    plate_number = models.CharField(
        max_length=50, blank=True, db_index=True, help_text="رقم اللوحة"
    )
    model_year = models.CharField(max_length=10, blank=True, help_text="سنة الصنع")
    color = models.CharField(max_length=50, blank=True, help_text="لون المركبة")
    status = models.CharField(
        max_length=20, choices=VEHICLE_STATUS_CHOICES, default="ready", db_index=True
    )

    # Vehicle affiliation
    affiliation_type = models.CharField(
        max_length=20,
        choices=[("internal", "تابعة للجهاز (فصيل داخلي)"), ("external", "تابعة لوحدة / جهة خارجية")],
        default="internal",
        db_index=True,
        help_text="نوع التبعية (داخلية للجهاز أو خارجية)",
    )
    faction = models.ForeignKey(
        "organization.Faction",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="vehicles",
        help_text="تبعية المركبة الفصائلية (في حال التبعية الداخلية)",
    )
    external_unit = models.ForeignKey(
        "transportation.ExternalUnit",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="vehicles",
        help_text="الوحدة أو الجهة الخارجية التابعة لها المركبة بالكامل",
    )
    assigned_driver = models.ForeignKey(
        "members.Member",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_vehicles",
        help_text="السائق أو المسؤول عن المركبة",
    )

    # Mounted weapon details
    has_weapon = models.BooleanField(
        default=False, help_text="هل تحمل المركبة سلاحاً مثبتاً؟"
    )
    mounted_weapon_name = models.CharField(
        max_length=150, blank=True, help_text="اسم السلاح المثبت"
    )
    mounted_weapon_serial = models.CharField(
        max_length=100, blank=True, help_text="رقم السلاح المثبت"
    )
    mounted_weapon_item = models.ForeignKey(
        "equipment.InventoryItem",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="mounted_on_vehicles",
        help_text="ربط اختياري بقطعة السلاح من قسم التسليح",
    )

    # Weapon affiliation (separate from vehicle affiliation)
    weapon_affiliation_type = models.CharField(
        max_length=20,
        choices=[("internal", "تابعة للجهاز (فصيل داخلي)"), ("external", "تابعة لوحدة / جهة خارجية")],
        default="internal",
        help_text="نوع تبعية السلاح المثبت",
    )
    weapon_faction = models.ForeignKey(
        "organization.Faction",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="mounted_weapon_vehicles",
        help_text="تبعية السلاح الفصائلية",
    )
    weapon_external_unit = models.ForeignKey(
        "transportation.ExternalUnit",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="mounted_weapons",
        help_text="الوحدة الخارجية التابع لها السلاح المثبت",
    )
    weapon_assigned_member = models.ForeignKey(
        "members.Member",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_mounted_weapons",
        help_text="الرامي أو المسؤول عن السلاح المثبت",
    )

    notes = models.TextField(blank=True, help_text="ملاحظات إضافية")

    created_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    updated_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "مركبة / آلية"
        verbose_name_plural = "سجل المركبات والآليات"

    def __str__(self):
        plate = f" [{self.plate_number}]" if self.plate_number else ""
        return f"{self.name} - {self.vin_number}{plate}"


VEHICLE_CUSTODY_ACTION_CHOICES = [
    ("assigned", "تسليم الآلية / تعيين سائق"),
    ("returned", "إرجاع واستلام الآلية"),
    ("maintenance", "إحالة للصيانة الفنية"),
    ("transfer", "نقل تبعية الآلية"),
]


class VehicleCustodyRecord(BaseModel):
    """Custody and driver assignment history log for vehicles."""

    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name="custody_records", help_text="المركبة المعنية"
    )
    driver = models.ForeignKey(
        "members.Member",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="vehicle_custody_records",
        help_text="السائق أو المسؤول عن الاستلام/الإرجاع",
    )
    external_unit = models.ForeignKey(
        "transportation.ExternalUnit",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="vehicle_custody_records",
        help_text="الوحدة الخارجية المعنية بالإجراء",
    )
    faction = models.ForeignKey(
        "organization.Faction",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="vehicle_custody_records",
        help_text="الفصيل المعني بالإجراء",
    )
    action = models.CharField(
        max_length=20, choices=VEHICLE_CUSTODY_ACTION_CHOICES, default="assigned"
    )
    action_date = models.DateField(auto_now_add=True, help_text="تاريخ الإجراء")
    odometer = models.PositiveIntegerField(null=True, blank=True, help_text="قراءة العداد (كم)")
    notes = models.TextField(blank=True, help_text="ملاحظات وحالة الآلية")
    issued_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "سجل حركة وحيازة الآلية"
        verbose_name_plural = "سجلات حركة وحيازة الآليات"

    def __str__(self):
        return f"{self.vehicle.name} — {self.get_action_display()}"
