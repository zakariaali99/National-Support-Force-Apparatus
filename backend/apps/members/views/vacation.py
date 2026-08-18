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

    def perform_create(self, serializer):
        vac_req = serializer.save(requested_by=self.request.user)
        try:
            from apps.core.activity import log_activity
            log_activity(
                actor=self.request.user,
                action="vacation_request_create",
                target_model="Member",
                target_id=vac_req.member_id,
                description=f"تقديم طلب إجازة ({vac_req.days} يوم) للفرد: {vac_req.member.full_name}",
                metadata={"days": vac_req.days, "target_name": vac_req.member.full_name},
                request=self.request,
            )
        except Exception:
            pass

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
        # Automatically update member's service_status to 'on_leave' (في إجازة)
        member = vacation_request.member
        if member.service_status != "on_leave":
            member.service_status = "on_leave"
            member.save(update_fields=["service_status", "updated_at"])

        try:
            from apps.core.activity import log_activity
            log_activity(
                actor=request.user,
                action="vacation_request_approve",
                target_model="Member",
                target_id=member.id,
                description=f"الموافقة واعتماد إجازة ({vacation_request.days} يوم) للفرد: {member.full_name}",
                metadata={"days": vacation_request.days, "target_name": member.full_name},
                request=request,
            )
        except Exception:
            pass

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

        try:
            from apps.core.activity import log_activity
            log_activity(
                actor=request.user,
                action="vacation_request_reject",
                target_model="Member",
                target_id=vacation_request.member_id,
                description=f"رفض طلب إجازة للفرد: {vacation_request.member.full_name}",
                metadata={"target_name": vacation_request.member.full_name},
                request=request,
            )
        except Exception:
            pass

        return Response(self.get_serializer(vacation_request).data)


class VacationTransactionViewSet(
    ScopedQuerysetMixin, mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    queryset = VacationTransaction.objects.select_related("member", "created_by").all()
    serializer_class = VacationTransactionSerializer
    permission_classes = [HasPermission]
    permission_map = {"list": "member.view", "create": "member.edit"}
    faction_lookup = "member__faction"
    filterset_fields = ["member", "kind"]

    def perform_create(self, serializer):
        data = serializer.validated_data
        member = data["member"]
        days = data["days"]
        reason = data.get("reason", "") or "تعديل إداري لرصيد الإجازات"
        kind = "adjustment" if days >= 0 else "deduction"
        instance = apply_vacation_transaction(
            member_id=member.id,
            days=days,
            kind=kind,
            reason=reason,
            created_by=self.request.user if self.request.user.is_authenticated else None,
        )
        serializer.instance = instance
        try:
            from apps.core.activity import log_activity
            log_activity(
                actor=self.request.user,
                action="vacation_balance_adjust",
                target_model="Member",
                target_id=member.id,
                description=f"تعديل رصيد إجازات الفرد: {member.full_name} ({days:+d} يوم) — {reason}",
                metadata={"days": days, "target_name": member.full_name},
                request=self.request,
            )
        except Exception:
            pass
