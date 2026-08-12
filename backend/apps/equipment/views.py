from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.core.activity import log_activity
from apps.equipment.models import InventoryCategory, InventoryItem, CustodyRecord
from apps.equipment.serializers import (
    InventoryCategorySerializer,
    InventoryItemSerializer,
    CustodyRecordSerializer,
)


class InventoryCategoryViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = InventoryCategory.objects.all()
    serializer_class = InventoryCategorySerializer


class InventoryItemViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = InventoryItem.objects.select_related("category", "faction", "assigned_member").all()
    serializer_class = InventoryItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        category_param = self.request.query_params.get("category")
        if category_param:
            qs = qs.filter(category_id=category_param)
        search_param = self.request.query_params.get("search")
        if search_param:
            qs = qs.filter(name__icontains=search_param) | qs.filter(serial_number__icontains=search_param)
        return qs

    def perform_create(self, serializer):
        item = serializer.save()
        log_activity(
            actor=self.request.user,
            action="inventory_create",
            target_model="InventoryItem",
            target_id=item.id,
            description=f"تسجيل سلاح/عتاد جديد للجرد: {item.name} (رقم تسلسلي: {item.serial_number or '—'})",
            request=self.request,
        )

    @action(detail=True, methods=["post"], url_path="assign-custody")
    def assign_custody(self, request, pk=None):
        item = self.get_object()
        member_id = request.data.get("member_id")
        faction_id = request.data.get("faction_id")
        notes = request.data.get("notes", "")

        item.assigned_member_id = member_id
        item.faction_id = faction_id
        item.save()

        CustodyRecord.objects.create(
            item=item,
            member_id=member_id,
            faction_id=faction_id,
            action="assigned",
            issued_by=request.user,
            notes=notes,
        )

        member_name = getattr(item.assigned_member, "full_name", "") or "الفدر"
        log_activity(
            actor=request.user,
            action="inventory_custody_assign",
            target_model="InventoryItem",
            target_id=item.id,
            description=f"تسليم عهدة قطعة السلاح/العتاد ({item.name}) للفرد ({member_name})",
            request=request,
        )

        return Response(InventoryItemSerializer(item).data)

    @action(detail=True, methods=["post"], url_path="release-custody")
    def release_custody(self, request, pk=None):
        item = self.get_object()
        notes = request.data.get("notes", "")

        member = item.assigned_member
        member_name = getattr(member, "full_name", "") if member else ""

        CustodyRecord.objects.create(
            item=item,
            member=member,
            faction=item.faction,
            action="returned",
            issued_by=request.user,
            notes=notes,
        )

        item.assigned_member = None
        item.save()

        log_activity(
            actor=request.user,
            action="inventory_custody_release",
            target_model="InventoryItem",
            target_id=item.id,
            description=f"إرجاع عهدة السلاح/العتاد ({item.name}) إلى المخزن الرئيسي" + (f" (كانت بحوزة {member_name})" if member_name else ""),
            request=request,
        )

        return Response(InventoryItemSerializer(item).data)


class CustodyRecordViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = CustodyRecord.objects.select_related("item", "member", "faction").all()
    serializer_class = CustodyRecordSerializer
