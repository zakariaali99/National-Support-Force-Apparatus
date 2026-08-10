from django.http import FileResponse, Http404

from django_filters import rest_framework as django_filters
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from apps.core.permissions.classes import HasPermission, ScopedQuerysetMixin
from apps.core.viewsets import SoftDeleteModelViewSet
from apps.members.models import Member
from apps.members.serializers.member import MemberListSerializer, MemberSerializer
from apps.members.utils.arabic import normalize_ar
from apps.workflow.services import notify, notify_many, users_with_permission_in_faction


class MemberFilter(django_filters.FilterSet):
    class Meta:
        model = Member
        fields = ["faction", "rank", "service_status", "approval_status"]


class MemberViewSet(ScopedQuerysetMixin, SoftDeleteModelViewSet):
    queryset = Member.objects.select_related("rank", "faction").all()
    permission_classes = [HasPermission]
    permission_map = {
        "list": "member.view",
        "retrieve": "member.view",
        "photo": "member.view",
        "create": "member.create",
        "update": "member.edit",
        "partial_update": "member.edit",
        "destroy": "member.delete",
        "submit": "member.edit",
        "approve": "member.approve",
        "reject": "member.approve",
    }
    filter_backends = [django_filters.DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = MemberFilter
    ordering_fields = ["last_name", "force_number", "created_at"]

    def get_serializer_class(self):
        return MemberListSerializer if self.action == "list" else MemberSerializer

    def get_queryset(self):
        # MRO: this -> ScopedQuerysetMixin.get_queryset() (faction scoping)
        # -> GenericAPIView.get_queryset() (base self.queryset).
        qs = super().get_queryset()

        search = self.request.query_params.get("search")
        if search:
            # Search against the normalized column, not first_name/last_name
            # directly — "احمد" must find a record stored as "أحمد".
            qs = qs.filter(search_name__icontains=normalize_ar(search))

        force_number = self.request.query_params.get("force_number")
        if force_number:
            qs = qs.filter(force_number__icontains=force_number)

        national_number = self.request.query_params.get("national_number")
        if national_number:
            qs = qs.filter(national_number__icontains=national_number)

        return qs

    @action(detail=True, methods=["get"], url_path="photo")
    def photo(self, request, pk=None):
        member = self.get_object()
        variant = request.query_params.get("variant", "main")
        file_field = member.photo_thumb if variant == "thumb" and member.photo_thumb else member.photo
        if not file_field:
            raise Http404
        response = FileResponse(file_field.open("rb"), content_type="image/jpeg")
        response["X-Content-Type-Options"] = "nosniff"
        return response

    # --- Approval workflow (Phase 6) -------------------------------------
    # approval_status is read-only on MemberSerializer by design (see
    # serializers/member.py) — these three actions are the ONLY way it
    # changes, so every transition is auditable via a dedicated permission
    # check instead of "whatever a PATCH payload happened to contain".

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        member = self.get_object()
        if member.approval_status not in ("draft", "rejected"):
            raise ValidationError("لا يمكن تقديم عضو ليس في حالة مسودة أو مرفوض.")
        member.approval_status = "pending"
        member.updated_by = request.user
        member.save(update_fields=["approval_status", "updated_by", "updated_at"])

        approvers = users_with_permission_in_faction("member.approve", member.faction_id).exclude(
            pk=request.user.pk
        )
        notify_many(
            approvers,
            "member_submitted",
            f"طلب اعتماد جديد بانتظار المراجعة: {member.full_name}",
            target_model="Member",
            target_object_id=member.id,
        )
        return Response(self.get_serializer(member).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        member = self.get_object()
        if member.approval_status != "pending":
            raise ValidationError("لا يمكن اعتماد عضو ليس بانتظار الاعتماد.")
        if member.created_by_id and member.created_by_id == request.user.id:
            raise PermissionDenied("لا يمكن لمن أنشأ سجل العضو اعتماده بنفسه.")

        member.approval_status = "approved"
        member.updated_by = request.user
        member.save(update_fields=["approval_status", "updated_by", "updated_at"])

        notify(
            member.created_by,
            "member_approved",
            f"تم اعتماد ملف العضو: {member.full_name}",
            target_model="Member",
            target_object_id=member.id,
        )
        return Response(self.get_serializer(member).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        member = self.get_object()
        if member.approval_status != "pending":
            raise ValidationError("لا يمكن رفض عضو ليس بانتظار الاعتماد.")
        if member.created_by_id and member.created_by_id == request.user.id:
            raise PermissionDenied("لا يمكن لمن أنشأ سجل العضو رفضه بنفسه.")

        member.approval_status = "rejected"
        member.updated_by = request.user
        member.save(update_fields=["approval_status", "updated_by", "updated_at"])

        reason = request.data.get("reason", "")
        message = f"تم رفض ملف العضو: {member.full_name}"
        if reason:
            message += f" — السبب: {reason}"
        notify(
            member.created_by,
            "member_rejected",
            message,
            target_model="Member",
            target_object_id=member.id,
        )
        return Response(self.get_serializer(member).data)
