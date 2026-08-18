import csv
from django.http import HttpResponse, HttpResponseBadRequest
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter
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
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["action", "actor", "target_model"]
    search_fields = [
        "description",
        "actor_username",
        "actor__username",
        "actor__first_name",
        "actor__last_name",
        "ip_address",
        "target_model",
        "target_id",
    ]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    @action(detail=False, methods=["get"])
    def stats(self, request):
        qs = self.get_queryset()
        total = qs.count()
        security_alerts = qs.filter(action__in=["login_failed"]).count()
        custody_inventory = qs.filter(
            action__in=[
                "inventory_create",
                "inventory_custody_assign",
                "inventory_custody_release",
            ]
        ).count()
        documents_print = qs.filter(
            action__in=["document_download", "print", "export"]
        ).count()
        backups = qs.filter(
            action__in=["backup_run", "backup_download"]
        ).count()
        return Response(
            {
                "total": total,
                "security_alerts": security_alerts,
                "custody_inventory": custody_inventory,
                "documents_print": documents_print,
                "backups": backups,
            }
        )

    @action(detail=False, methods=["get"], url_path="export-csv")
    def export_csv(self, request):
        qs = self.filter_queryset(self.get_queryset())
        is_superuser = bool(request.user and getattr(request.user, "is_superuser", False))
        response = HttpResponse(content_type="text/csv; charset=utf-8-sig")
        response["Content-Disposition"] = 'attachment; filename="nasf_audit_log.csv"'

        writer = csv.writer(response)
        headers = [
            "المعرف",
            "التاريخ والوقت",
            "المستخدم",
            "نوع الإجراء",
            "المكون المستهدف",
            "رقم المستهدف",
        ]
        if is_superuser:
            headers.append("عنوان IP")
        headers.append("البيان والتفاصيل")

        writer.writerow(headers)
        for log in qs[:5000]:
            actor_str = (
                log.actor.full_name
                if (log.actor and log.actor.full_name)
                else (log.actor_username or "النظام")
            )
            row = [
                log.id,
                log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                actor_str,
                log.action,
                log.target_model or "—",
                log.target_id or "—",
            ]
            if is_superuser:
                row.append(log.ip_address or "—")
            row.append(log.description or "—")
            writer.writerow(row)
        return response


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
