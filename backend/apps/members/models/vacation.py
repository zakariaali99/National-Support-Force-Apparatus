from django.db import models

from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel

REQUEST_STATUS_CHOICES = [
    ("pending", "بانتظار الاعتماد"),
    ("approved", "معتمدة"),
    ("rejected", "مرفوضة"),
]

TRANSACTION_KIND_CHOICES = [
    ("accrual", "استحقاق"),
    ("deduction", "خصم إجازة"),
    ("adjustment", "تسوية يدوية"),
]


class VacationRequest(BaseModel):
    member = models.ForeignKey(
        "members.Member", on_delete=models.CASCADE, related_name="vacation_requests"
    )
    start_date = models.DateField()
    end_date = models.DateField()
    days = models.DecimalField(max_digits=6, decimal_places=1)
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=REQUEST_STATUS_CHOICES, default="pending", db_index=True)
    requested_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    decided_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    decided_at = models.DateTimeField(null=True, blank=True)

    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Vacation Request"
        verbose_name_plural = "Vacation Requests"

    def __str__(self):
        return f"{self.member} — {self.start_date}..{self.end_date}"


class VacationTransaction(BaseModel):
    """Append-only ledger; Member.vacation_balance_days is a denormalized
    cache recomputed atomically whenever a row is written here (see
    apps.members.services.vacation.apply_vacation_transaction) — never
    edit vacation_balance_days directly.
    """

    member = models.ForeignKey(
        "members.Member", on_delete=models.CASCADE, related_name="vacation_transactions"
    )
    # Positive for accrual/adjustment credit, negative for deduction/debit.
    days = models.DecimalField(max_digits=6, decimal_places=1)
    kind = models.CharField(max_length=20, choices=TRANSACTION_KIND_CHOICES)
    reason = models.CharField(max_length=255, blank=True)
    vacation_request = models.ForeignKey(
        VacationRequest, null=True, blank=True, on_delete=models.SET_NULL, related_name="transactions"
    )
    created_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Vacation Transaction"
        verbose_name_plural = "Vacation Transactions"

    def __str__(self):
        return f"{self.member} — {self.days} ({self.kind})"
