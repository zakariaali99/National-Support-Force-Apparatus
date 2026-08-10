from django.core.management.base import BaseCommand

from apps.members.field_registry import FIELD_REGISTRY
from apps.members.models import FieldRequirement


class Command(BaseCommand):
    help = (
        "Create a FieldRequirement row for any FIELD_REGISTRY key that doesn't "
        "have one yet. Idempotent — never touches existing rows, safe to run "
        "on every deploy so a renamed/added registry field always gets a "
        "working default without needing a hand-written migration."
    )

    def handle(self, *args, **options):
        created = 0
        for index, field in enumerate(FIELD_REGISTRY):
            _, was_created = FieldRequirement.objects.get_or_create(
                field_key=field["key"],
                defaults={
                    "is_required": field["default_required"],
                    "is_visible": True,
                    "order": index,
                },
            )
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Synced field requirements: {created} created."))
