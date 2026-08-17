from datetime import date
from django.db import models
from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel


SHIFT_PATTERN_CHOICES = [
    ("alert_24_72", "فصيل الإنذار (1 يوم عمل + 3 أيام راحة)"),
    ("guard_24_96", "فصيل الحراسات (1 يوم عمل + 4 أيام عطلة)"),
    ("daily_admin", "دوام إداري يومي (أحد - خميس)"),
    ("custom", "دورة مخصصة"),
]


class ShiftRosterGroup(BaseModel):
    """A shift/roster group (e.g., نوبة أ, نوبة ب, نوبة ج, نوبة د) in a faction."""

    faction = models.ForeignKey(
        "organization.Faction",
        on_delete=models.CASCADE,
        related_name="shift_groups",
        help_text="الفصيل التابعة له هذه النوبة",
    )
    name_ar = models.CharField(max_length=100, help_text="اسم النوبة / المجموعة (مثال: نوبة أ)")
    code = models.SlugField(max_length=50, blank=True)
    pattern = models.CharField(
        max_length=30, choices=SHIFT_PATTERN_CHOICES, default="alert_24_72"
    )

    # Dynamic cycle math
    cycle_days = models.PositiveIntegerField(
        default=4, help_text="إجمالي أيام الدورة (مثال: 4 للإنذار، 5 للحراسات)"
    )
    work_days = models.PositiveIntegerField(
        default=1, help_text="عدد أيام العمل المتتالية في الدورة"
    )
    rest_days = models.PositiveIntegerField(
        default=3, help_text="عدد أيام الراحة المتتالية في الدورة"
    )
    anchor_date = models.DateField(
        default=date(2026, 1, 1),
        help_text="التاريخ المرجعي لبدء الدورة",
    )
    group_offset = models.PositiveIntegerField(
        default=0,
        help_text="إزاحة اليوم في الدورة (0 = تبدأ أول يوم، 1 = تبدأ ثاني يوم...)",
    )

    # Timing & Hours
    start_time = models.TimeField(
        null=True, blank=True, help_text="وقت بدء الخدمة (مثال: 08:00)"
    )
    end_time = models.TimeField(
        null=True, blank=True, help_text="وقت نهاية الخدمة (مثال: 08:00 لليوم التالي)"
    )
    shift_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=24.0,
        help_text="إجمالي ساعات النوبة (مثال: 24.0 أو 8.0)",
    )

    members = models.ManyToManyField(
        "members.Member",
        blank=True,
        related_name="shift_rosters",
        help_text="الأفراد المعينون في هذه النوبة",
    )

    is_active = models.BooleanField(default=True)
    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["faction", "name_ar"]
        verbose_name = "مجموعة نوبات / وردية"
        verbose_name_plural = "مجموعات النوبات والورديات"

    def __str__(self):
        return f"{self.faction.name_ar} - {self.name_ar} ({self.get_pattern_display()})"

    def is_on_duty_on(self, target_date: date) -> bool:
        """Dynamically determine if this shift group is on duty on target_date."""
        if self.pattern == "daily_admin":
            # Monday=0, Tuesday=1, Wednesday=2, Thursday=3, Friday=4, Saturday=5, Sunday=6
            # In standard MENA workweek (Sunday..Thursday on, Friday..Saturday off)
            return target_date.weekday() not in (4, 5)  # 4=Friday, 5=Saturday

        delta_days = (target_date - self.anchor_date).days
        day_in_cycle = (delta_days + self.group_offset) % self.cycle_days
        return day_in_cycle < self.work_days
