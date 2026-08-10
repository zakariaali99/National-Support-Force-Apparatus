from datetime import date

from django.core.management.base import BaseCommand

from apps.core.models import ScheduledJobRun
from apps.members.models import Member
from apps.members.services.vacation import apply_vacation_transaction

MONTHLY_ACCRUAL_DAYS = 2


class Command(BaseCommand):
    help = (
        "Accrues MONTHLY_ACCRUAL_DAYS of vacation for every active member. "
        "Idempotent per calendar month — see ScheduledJobRun."
    )

    def handle(self, *args, **options):
        period_key = date.today().strftime("%Y-%m")
        job, created = ScheduledJobRun.objects.get_or_create(name="accrue_vacation", period_key=period_key)
        if not created and job.success:
            self.stdout.write(self.style.WARNING(f"Already ran for {period_key}; skipping."))
            return

        try:
            count = self._run(period_key)
            job.mark_success(detail=f"{count} member(s) accrued")
            self.stdout.write(self.style.SUCCESS(f"Accrued vacation for {count} member(s)."))
        except Exception as exc:
            job.mark_failure(detail=str(exc))
            raise

    def _run(self, period_key):
        count = 0
        for member_id in Member.objects.filter(service_status="active").values_list("id", flat=True):
            apply_vacation_transaction(
                member_id=member_id,
                days=MONTHLY_ACCRUAL_DAYS,
                kind="accrual",
                reason=f"استحقاق شهري ({period_key})",
            )
            count += 1
        return count
