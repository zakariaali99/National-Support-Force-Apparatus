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
        item = serializer.save(created_by=self.request.user)
        # Ensure available_quantity is coherent with total_quantity if not set
        if item.available_quantity == 0 and item.assigned_quantity == 0 and item.damaged_quantity == 0:
            item.available_quantity = item.total_quantity
            item.save(update_fields=["available_quantity"])

        log_activity(
            actor=self.request.user,
            action="inventory_create",
            target_model="InventoryItem",
            target_id=item.id,
            description=f"تسجيل صنف/سلاح جديد للجرد: {item.name} (رقم: {item.serial_number or item.item_code or '—'})",
            metadata={
                "item_name": item.name,
                "item_code": item.item_code or "",
                "serial_number": item.serial_number or "",
                "size_spec": item.size_spec or "",
                "total_quantity": item.total_quantity,
                "status": item.status,
            },
            request=self.request,
        )

    @action(detail=True, methods=["post"], url_path="assign-custody")
    def assign_custody(self, request, pk=None):
        item = self.get_object()
        member_id = request.data.get("member_id")
        faction_id = request.data.get("faction_id")
        qty = int(request.data.get("quantity", 1) or 1)
        notes = request.data.get("notes", "")

        if item.available_quantity < qty:
            return Response(
                {"detail": f"الكمية المتاحة في المخزن ({item.available_quantity}) غير كافية لصرف ({qty})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.available_quantity = max(0, item.available_quantity - qty)
        item.assigned_quantity = item.assigned_quantity + qty
        item.assigned_member_id = member_id
        if faction_id:
            item.faction_id = faction_id
        item.save()

        CustodyRecord.objects.create(
            item=item,
            member_id=member_id,
            faction_id=faction_id or item.faction_id,
            action="assigned",
            quantity=qty,
            issued_by=request.user,
            notes=notes,
        )

        member_name = getattr(item.assigned_member, "full_name", "") or "الفرد"
        force_num = getattr(item.assigned_member, "force_number", "") or ""

        log_activity(
            actor=request.user,
            action="inventory_custody_assign",
            target_model="InventoryItem",
            target_id=item.id,
            description=f"تسليم عهدة ({qty}) من ({item.name}) للفرد ({member_name})",
            metadata={
                "item_name": item.name,
                "quantity": qty,
                "serial_number": item.serial_number or "",
                "assigned_member": member_name,
                "force_number": force_num,
            },
            request=request,
        )

        return Response(InventoryItemSerializer(item).data)

    @action(detail=True, methods=["post"], url_path="release-custody")
    def release_custody(self, request, pk=None):
        item = self.get_object()
        qty = int(request.data.get("quantity", 1) or 1)
        notes = request.data.get("notes", "")

        member = item.assigned_member
        member_name = getattr(member, "full_name", "") if member else ""

        qty_to_return = min(qty, item.assigned_quantity) if item.assigned_quantity > 0 else qty
        item.assigned_quantity = max(0, item.assigned_quantity - qty_to_return)
        item.available_quantity = min(item.total_quantity, item.available_quantity + qty_to_return)
        if item.assigned_quantity == 0:
            item.assigned_member = None
        item.save()

        CustodyRecord.objects.create(
            item=item,
            member=member,
            faction=item.faction,
            action="returned",
            quantity=qty_to_return,
            issued_by=request.user,
            notes=notes,
        )

        log_activity(
            actor=request.user,
            action="inventory_custody_release",
            target_model="InventoryItem",
            target_id=item.id,
            description=f"إرجاع عهدة ({qty_to_return}) من ({item.name}) إلى المخزن الرئيسي" + (f" (كانت بحوزة {member_name})" if member_name else ""),
            metadata={
                "item_name": item.name,
                "quantity": qty_to_return,
                "serial_number": item.serial_number or "",
                "released_from_member": member_name,
            },
            request=request,
        )

        return Response(InventoryItemSerializer(item).data)

    @action(detail=True, methods=["post"], url_path="mark-damaged")
    def mark_damaged(self, request, pk=None):
        item = self.get_object()
        qty = int(request.data.get("quantity", 1) or 1)
        source = request.data.get("source", "custody")  # "custody" or "warehouse"
        notes = request.data.get("notes", "")

        member = item.assigned_member
        member_name = getattr(member, "full_name", "") if member else ""

        if source == "custody":
            qty_damaged = min(qty, item.assigned_quantity) if item.assigned_quantity > 0 else qty
            item.assigned_quantity = max(0, item.assigned_quantity - qty_damaged)
            if item.assigned_quantity == 0:
                item.assigned_member = None
        else:
            qty_damaged = min(qty, item.available_quantity) if item.available_quantity > 0 else qty
            item.available_quantity = max(0, item.available_quantity - qty_damaged)

        item.damaged_quantity = item.damaged_quantity + qty_damaged
        item.save()

        CustodyRecord.objects.create(
            item=item,
            member=member,
            faction=item.faction,
            action="damaged",
            quantity=qty_damaged,
            issued_by=request.user,
            notes=f"تسجيل تالف/مكهن: {notes}",
        )

        log_activity(
            actor=request.user,
            action="inventory_mark_damaged",
            target_model="InventoryItem",
            target_id=item.id,
            description=f"تسجيل تالف/فاقد ({qty_damaged}) من الصنف ({item.name})" + (f" (من عهدة {member_name})" if member_name else " (من المخزن)"),
            metadata={
                "item_name": item.name,
                "quantity": qty_damaged,
                "source": source,
                "notes": notes,
            },
            request=request,
        )

        return Response(InventoryItemSerializer(item).data)


class CustodyRecordViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = CustodyRecord.objects.select_related("item", "member", "faction").all()
    serializer_class = CustodyRecordSerializer
