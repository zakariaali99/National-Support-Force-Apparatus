from django.db import transaction
from django.db.models import Sum

from apps.members.models import Member
from apps.members.models.vacation import VacationTransaction


def apply_vacation_transaction(*, member_id, days, kind, reason="", vacation_request=None, created_by=None):
    """Writes a VacationTransaction row and updates Member.vacation_balance_days
    inside one atomic block with a row lock, so two concurrent writes (e.g. an
    approval and a manual adjustment) can never race and leave the cache out
    of sync with the ledger. Only entry point that should ever change
    Member.vacation_balance_days — do not set that field directly elsewhere.
    """
    with transaction.atomic():
        member = Member.objects.select_for_update().get(pk=member_id)
        txn = VacationTransaction.objects.create(
            member=member,
            days=days,
            kind=kind,
            reason=reason,
            vacation_request=vacation_request,
            created_by=created_by,
        )
        member.vacation_balance_days = member.vacation_balance_days + days
        member.save(update_fields=["vacation_balance_days", "updated_at"])
        return txn


def recompute_balance(member_id):
    """Repair helper: recomputes vacation_balance_days from the ledger,
    ignoring the cached value entirely. Used by the
    recompute_vacation_balances management command.
    """
    with transaction.atomic():
        member = Member.objects.select_for_update().get(pk=member_id)
        total = (
            VacationTransaction.objects.filter(member=member).aggregate(total=Sum("days"))["total"] or 0
        )
        member.vacation_balance_days = total
        member.save(update_fields=["vacation_balance_days", "updated_at"])
        return total
