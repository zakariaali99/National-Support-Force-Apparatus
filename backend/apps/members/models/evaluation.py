from django.db import models

from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel


class MemberEvaluation(BaseModel):
    member = models.ForeignKey("members.Member", on_delete=models.CASCADE, related_name="evaluations")
    period_start = models.DateField()
    period_end = models.DateField()
    body = models.TextField()
    score = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    evaluator = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    evaluated_on = models.DateField(auto_now_add=True)

    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["-period_end"]
        verbose_name = "Member Evaluation"
        verbose_name_plural = "Member Evaluations"

    def __str__(self):
        return f"{self.member} — {self.period_start}..{self.period_end}"
