from django.http import FileResponse, Http404

from django_filters import rest_framework as django_filters
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter

from apps.core.activity import log_activity
from apps.core.permissions.classes import HasPermission, ScopedQuerysetMixin
from apps.core.viewsets import SoftDeleteModelViewSet
from apps.members.models import Member
from apps.members.serializers.member import MemberListSerializer, MemberSerializer
from apps.members.utils.arabic import normalize_ar


class MemberFilter(django_filters.FilterSet):
    class Meta:
        model = Member
        fields = ["faction", "rank", "service_status", "approval_status"]


class MemberViewSet(ScopedQuerysetMixin, SoftDeleteModelViewSet):
    queryset = Member.objects.select_related("rank", "faction").all()
    permission_classes = [HasPermission]
    permission_map = {
        "list": [
            "member.view",
            "transportation.view",
            "transportation.manage",
            "equipment.view",
            "equipment.manage",
            "attendance.view",
            "attendance.record",
        ],
        "retrieve": [
            "member.view",
            "transportation.view",
            "transportation.manage",
            "equipment.view",
            "equipment.manage",
            "attendance.view",
            "attendance.record",
        ],
        "photo": [
            "member.view",
            "transportation.view",
            "transportation.manage",
            "equipment.view",
            "equipment.manage",
            "attendance.view",
            "attendance.record",
        ],
        "create": "member.create",
        "update": "member.edit",
        "partial_update": "member.edit",
        "destroy": "member.delete",
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

    def perform_create(self, serializer):
        member = serializer.save(created_by=self.request.user)
        try:
            log_activity(
                actor=self.request.user,
                action="member_create",
                target_model="Member",
                target_id=member.id,
                description=f"إضافة فرد جديد في المنظومة: {member.full_name} ({member.force_number or 'بدون رقم'})",
                metadata={
                    "force_number": member.force_number,
                    "faction": member.faction.name_ar if member.faction else "",
                    "rank": member.rank.name_ar if member.rank else "",
                },
                request=self.request,
            )
        except Exception:
            pass

    def perform_update(self, serializer):
        old_member = self.get_object()
        old_faction = old_member.faction.name_ar if old_member.faction else "بدون فصيل"
        old_rank = old_member.rank.name_ar if old_member.rank else "بدون رتبة"
        old_status = old_member.service_status

        member = serializer.save(updated_by=self.request.user)

        new_faction = member.faction.name_ar if member.faction else "بدون فصيل"
        new_rank = member.rank.name_ar if member.rank else "بدون رتبة"
        new_status = member.service_status

        changes = {}
        if old_faction != new_faction:
            changes["faction"] = {"old": old_faction, "new": new_faction}
        if old_rank != new_rank:
            changes["rank"] = {"old": old_rank, "new": new_rank}
        if old_status != new_status:
            changes["service_status"] = {"old": old_status, "new": new_status}

        desc = f"تعديل وتحديث بيانات الفرد: {member.full_name} ({member.force_number or '—'})"
        if "faction" in changes:
            desc += f" • نقل الفصيل: من ({old_faction}) إلى ({new_faction})"
        if "rank" in changes:
            desc += f" • تعديل الرتبة: من ({old_rank}) إلى ({new_rank})"

        try:
            log_activity(
                actor=self.request.user,
                action="member_update",
                target_model="Member",
                target_id=member.id,
                description=desc,
                metadata={
                    "force_number": member.force_number,
                    "target_name": member.full_name,
                    "changes": changes,
                },
                request=self.request,
            )
        except Exception:
            pass

    def perform_destroy(self, instance):
        instance.soft_delete()
        try:
            log_activity(
                actor=self.request.user,
                action="member_delete",
                target_model="Member",
                target_id=instance.id,
                description=f"حذف وأرشفة ملف الفرد: {instance.full_name} ({instance.force_number or '—'})",
                metadata={"force_number": instance.force_number, "target_name": instance.full_name},
                request=self.request,
            )
        except Exception:
            pass

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
