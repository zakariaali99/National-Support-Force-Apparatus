from django.db import models
from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel


ATTENDANCE_STATUS_CHOICES = [
    ("present", "حاضر"),
    ("late", "متأخر"),
    ("early_departure", "انصراف مبكر"),
    ("excused_absence", "غياب بإذن (مخصوم)"),
    ("unexcused_absence", "غياب بدون إذن"),
    ("shift_off", "راحة نوبة"),
    ("vacation", "إجازة رسمية"),
    ("mission", "مأمورية / تكليف"),
]

EXPECTED_DUTY_CHOICES = [
    ("duty", "واجب / خدمة"),
    ("off", "راحة نوبة مجدولة"),
    ("admin", "دوام إداري"),
]


class DailyAttendance(BaseModel):
    """Daily attendance and discipline roll-call record with hourly precision."""

    member = models.ForeignKey(
        "members.Member",
        on_delete=models.CASCADE,
        related_name="attendance_records",
        help_text="الفرد",
    )
    date = models.DateField(db_index=True, help_text="تاريخ التمام")
    status = models.CharField(
        max_length=30,
        choices=ATTENDANCE_STATUS_CHOICES,
        default="present",
        db_index=True,
        help_text="حالة التمام الفعلية",
    )
    expected_status = models.CharField(
        max_length=20,
        choices=EXPECTED_DUTY_CHOICES,
        default="duty",
        help_text="الحالة المتوقعة طبقاً لجدول النوبات",
    )

    # Time tracking
    check_in_time = models.TimeField(
        null=True, blank=True, help_text="وقت الحضور الفعلي"
    )
    check_out_time = models.TimeField(
        null=True, blank=True, help_text="وقت الانصراف الفعلي"
    )

    # Hourly calculations
    late_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.0,
        help_text="ساعات التأخير",
    )
    early_departure_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.0,
        help_text="ساعات الانصراف المبكر",
    )
    excused_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.0,
        help_text="ساعات الاستئذان أو الغياب المأذون",
    )

    # Vacation balance deduction linkage
    deducted_vacation_days = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0.0,
        help_text="أيام الإجازة المخصومة من الرصيد",
    )
    vacation_transaction = models.ForeignKey(
        "members.VacationTransaction",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="attendance_records",
        help_text="سجل حركة الخصم المالي/الإداري من رصيد الإجازات",
    )

    notes = models.TextField(blank=True, help_text="ملاحظات التمام أو أسباب التأخير والإذن")
    recorded_by = models.ForeignKey(
        "core.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["-date", "member__first_name", "member__last_name"]
        verbose_name = "سجل التمام اليومي"
        verbose_name_plural = "سجلات التمام اليومي"
        constraints = [
            models.UniqueConstraint(
                fields=["member", "date"],
                condition=models.Q(is_deleted=False),
                name="unique_active_member_daily_attendance",
            )
        ]

    def __str__(self):
        return f"{self.member.full_name} - {self.date}: {self.get_status_display()}"
