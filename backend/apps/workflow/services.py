"""Notification-creation helpers, kept out of apps.members so that app
doesn't need to import apps.workflow's model directly at module load time
(avoids an app-loading-order dependency) and so all "who gets notified
when" logic lives in one place.
"""

from django.db.models import Q

from apps.core.models import User
from apps.workflow.models import Notification


def users_with_permission_in_faction(codename, faction_id):
    """Every user who can act on a record in this faction: either an
    "all"-scoped role, or an "own_faction"-scoped role plus that faction
    assigned. Relies on Postgres JSONField containment (`permissions`
    stores a plain list of codenames) — matches this project's "Postgres,
    dev too" decision, see PLAN.md.
    """
    return (
        User.objects.filter(roles__permissions__contains=[codename])
        .filter(Q(roles__scope="all") | (Q(roles__scope="own_faction") & Q(factions=faction_id)))
        .distinct()
    )


def notify(recipient, verb, message, target_model="", target_object_id=None):
    if recipient is None:
        return None
    return Notification.objects.create(
        recipient=recipient,
        verb=verb,
        message=message,
        target_model=target_model,
        target_object_id=target_object_id,
    )


def notify_many(recipients, verb, message, target_model="", target_object_id=None):
    Notification.objects.bulk_create(
        [
            Notification(
                recipient=r,
                verb=verb,
                message=message,
                target_model=target_model,
                target_object_id=target_object_id,
            )
            for r in recipients
        ]
    )
