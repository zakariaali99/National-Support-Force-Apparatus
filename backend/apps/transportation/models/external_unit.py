from django.db import models
from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel


class ExternalUnit(BaseModel):
    """External military/security/government unit or outside entity (جهة التبعية الخارجية)."""

    name_ar = models.CharField(
        max_length=150, unique=True, help_text="اسم الوحدة أو الجهة الخارجية"
    )
    code = models.SlugField(
        max_length=50, blank=True, help_text="كود أو رمز تعريفي للوحدة"
    )
    commander_name = models.CharField(
        max_length=100, blank=True, help_text="آمر الوحدة أو مسؤول التنسيق"
    )
    phone = models.CharField(
        max_length=50, blank=True, help_text="رقم هاتف التواصل"
    )
    notes = models.TextField(
        blank=True, help_text="ملاحظات أو قرار الإعارة والتبعية"
    )
    is_active = models.BooleanField(
        default=True, db_index=True, help_text="حالة النشاط"
    )

    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["name_ar"]
        verbose_name = "وحدة / جهة خارجية"
        verbose_name_plural = "الوحدات والجهات الخارجية"

    def __str__(self):
        return self.name_ar
