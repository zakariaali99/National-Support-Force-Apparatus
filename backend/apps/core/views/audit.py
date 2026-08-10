from django.http import HttpResponseBadRequest

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import ActivityLog
from apps.core.permissions.classes import HasPermission
from apps.core.serializers.audit import ActivityLogSerializer


class ActivityLogViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Read-only — ActivityLog is append-only, written exclusively through
    apps.core.activity.log_activity from server-side call sites. No
    create/update/delete API by design.
    """

    queryset = ActivityLog.objects.select_related("actor").all()
    serializer_class = ActivityLogSerializer
    permission_classes = [HasPermission]
    required_permission = "audit.view"
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["action", "actor", "target_model"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]


def _history_models():
    # Imported lazily so apps.core doesn't need apps.members/apps.organization
    # importable at module-load time — this file is only evaluated once
    # URLs are wired, by which point every app is ready, but keeping the
    # import local avoids any ordering assumption.
    from apps.members.models import Member, MemberDocument
    from apps.organization.models import DocumentType, Faction, Rank

    return {
        "member": Member,
        "member_document": MemberDocument,
        "rank": Rank,
        "faction": Faction,
        "document_type": DocumentType,
    }


class HistoryView(APIView):
    """GET /api/audit/history/?model=member&id=5 — field-level change
    history for one record, computed from django-simple-history's
    HistoricalRecords (already attached to these five models since Phase
    1/2). This is a *view* over data that already exists; ActivityLog is a
    separate, append-only log for actions HistoricalRecords doesn't see
    (reads) — see apps.core.models.activity_log.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter("model", OpenApiTypes.STR, description="One of: " + ", ".join(_history_models())),
            OpenApiParameter("id", OpenApiTypes.INT),
        ],
        responses={200: OpenApiTypes.OBJECT},
    )
    def get(self, request):
        if not request.user.has_permission("audit.view"):
            raise PermissionDenied("لا تملك صلاحية عرض سجل التدقيق.")

        models = _history_models()
        model_key = request.query_params.get("model")
        object_id = request.query_params.get("id")
        if model_key not in models or not object_id:
            return HttpResponseBadRequest(
                f"model must be one of {', '.join(models)}, and id is required"
            )

        model = models[model_key]
        records = list(model.history.filter(id=object_id).order_by("history_date"))

        entries = []
        previous = None
        for record in records:
            changes = []
            if previous is not None:
                delta = record.diff_against(previous)
                changes = [
                    {"field": c.field, "old": str(c.old), "new": str(c.new)} for c in delta.changes
                ]
            entries.append(
                {
                    "history_date": record.history_date,
                    "history_type": record.get_history_type_display(),
                    "history_user": record.history_user.username if record.history_user else None,
                    "changes": changes,
                }
            )
            previous = record

        entries.reverse()
        return Response(entries)
