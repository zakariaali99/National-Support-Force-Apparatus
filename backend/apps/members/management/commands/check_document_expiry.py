from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db.models import F

from apps.core.models import ScheduledJobRun
from apps.members.models import DocumentExpiryAlert, MemberDocument
from apps.workflow.services import notify_many, users_with_permission_in_faction


class Command(BaseCommand):
    help = (
        "Notifies supervisors (member.approve) of documents expiring within their "
        "document_type's expiry_warn_days window. Idempotent per (document, expiry_date) — "
        "see DocumentExpiryAlert."
    )

    def handle(self, *args, **options):
        today = date.today()
        period_key = today.isoformat()
        job, created = ScheduledJobRun.objects.get_or_create(name="check_document_expiry", period_key=period_key)
        if not created and job.success:
            self.stdout.write(self.style.WARNING(f"Already ran for {period_key}; skipping."))
            return

        try:
            sent = self._run(today)
            job.mark_success(detail=f"{sent} alert(s) sent")
            self.stdout.write(self.style.SUCCESS(f"Sent {sent} expiry alert(s)."))
        except Exception as exc:
            job.mark_failure(detail=str(exc))
            raise

    def _run(self, today):
        candidates = (
            MemberDocument.objects.filter(
                document_type__requires_expiry=True,
                expiry_date__isnull=False,
                is_current=True,
            )
            .select_related("document_type", "member", "member__faction")
            .annotate(warn_days=F("document_type__expiry_warn_days"))
        )

        sent = 0
        for document in candidates:
            warn_from = document.expiry_date - timedelta(days=document.warn_days)
            if today < warn_from:
                continue  # not in the warning window yet

            _, alert_created = DocumentExpiryAlert.objects.get_or_create(
                document=document, expiry_date=document.expiry_date
            )
            if not alert_created:
                continue  # already alerted for this exact expiry date

            recipients = users_with_permission_in_faction("member.approve", document.member.faction_id)
            days_left = (document.expiry_date - today).days
            status = "منتهية الصلاحية" if days_left < 0 else f"تنتهي خلال {days_left} يوم"
            notify_many(
                recipients,
                "document_expiring",
                f"{document.document_type.name_ar} للعضو {document.member.full_name} {status}",
                target_model="MemberDocument",
                target_object_id=document.id,
            )
            sent += 1
        return sent
