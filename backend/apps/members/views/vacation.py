from django.utils import timezone

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.core.permissions.classes import HasPermission, ScopedQuerysetMixin
from apps.core.viewsets import SoftDeleteModelViewSet
from apps.members.models.vacation import VacationRequest, VacationTransaction
from apps.members.serializers.vacation import VacationRequestSerializer, VacationTransactionSerializer
from apps.members.services.vacation import apply_vacation_transaction


class VacationRequestViewSet(ScopedQuerysetMixin, SoftDeleteModelViewSet):
    queryset = VacationRequest.objects.select_related("member", "requested_by", "decided_by").all()
    serializer_class = VacationRequestSerializer
    permission_classes = [HasPermission]
    permission_map = {
        "list": "member.view",
        "retrieve": "member.view",
        "create": "member.edit",
        "update": "member.edit",
        "partial_update": "member.edit",
        "destroy": "member.edit",
        "approve": "vacation.approve",
        "reject": "vacation.approve",
    }
    faction_lookup = "member__faction"
    filterset_fields = ["member", "status"]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        vacation_request = self.get_object()
        if vacation_request.status != "pending":
            raise PermissionDenied("لا يمكن اعتماد طلب تم البت فيه مسبقاً.")
        vacation_request.status = "approved"
        vacation_request.decided_by = request.user
        vacation_request.decided_at = timezone.now()
        vacation_request.save(update_fields=["status", "decided_by", "decided_at", "updated_at"])
        apply_vacation_transaction(
            member_id=vacation_request.member_id,
            days=-vacation_request.days,
            kind="deduction",
            reason=f"اعتماد طلب إجازة #{vacation_request.id}",
            vacation_request=vacation_request,
            created_by=request.user,
        )
        return Response(self.get_serializer(vacation_request).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        vacation_request = self.get_object()
        if vacation_request.status != "pending":
            raise PermissionDenied("لا يمكن رفض طلب تم البت فيه مسبقاً.")
        vacation_request.status = "rejected"
        vacation_request.decided_by = request.user
        vacation_request.decided_at = timezone.now()
        vacation_request.save(update_fields=["status", "decided_by", "decided_at", "updated_at"])
        return Response(self.get_serializer(vacation_request).data)


class VacationTransactionViewSet(ScopedQuerysetMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """Read-only ledger view — transactions are only ever written by
    apps.members.services.vacation.apply_vacation_transaction, never
    through this API directly.
    """

    queryset = VacationTransaction.objects.select_related("member", "created_by").all()
    serializer_class = VacationTransactionSerializer
    permission_classes = [HasPermission]
    permission_map = {"list": "member.view"}
    faction_lookup = "member__faction"
    filterset_fields = ["member", "kind"]
