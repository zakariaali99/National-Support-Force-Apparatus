from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.core.activity import log_activity
from apps.core.permissions.classes import HasPermission
from apps.equipment.models import CustodyRecord, InventoryCategory, InventoryItem
from apps.equipment.serializers import (
    CustodyRecordSerializer,
    InventoryCategorySerializer,
    InventoryItemSerializer,
)


class InventoryCategoryViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, HasPermission]
    permission_map = {
        "list": ["equipment.view", "equipment.manage", "settings.manage"],
        "retrieve": ["equipment.view", "equipment.manage", "settings.manage"],
        "create": ["equipment.manage", "settings.manage"],
        "update": ["equipment.manage", "settings.manage"],
        "partial_update": ["equipment.manage", "settings.manage"],
        "destroy": ["equipment.manage", "settings.manage"],
    }
    queryset = InventoryCategory.objects.all()
    serializer_class = InventoryCategorySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        domain_param = self.request.query_params.get("domain")
        if domain_param:
            qs = qs.filter(domain=domain_param)

        category_type_param = self.request.query_params.get("category_type")
        if category_type_param:
            qs = qs.filter(category_type=category_type_param)

        search_param = self.request.query_params.get("search")
        if search_param:
            qs = qs.filter(
                Q(name_ar__icontains=search_param)
                | Q(code__icontains=search_param)
                | Q(description__icontains=search_param)
            )
        return qs

    def perform_create(self, serializer):
        cat = serializer.save()
        domain_text = "قسم التسليح" if cat.domain == "armory" else "المخازن العامة"
        log_activity(
            actor=self.request.user,
            action="inventory_category_create",
            target_model="InventoryCategory",
            target_id=cat.id,
            description=f"إضافة تصنيف جديد في ({domain_text}): {cat.name_ar}",
            metadata={"name": cat.name_ar, "domain": cat.domain, "type": cat.category_type},
            request=self.request,
        )

    def perform_update(self, serializer):
        cat = serializer.save()
        domain_text = "قسم التسليح" if cat.domain == "armory" else "المخازن العامة"
        log_activity(
            actor=self.request.user,
            action="inventory_category_update",
            target_model="InventoryCategory",
            target_id=cat.id,
            description=f"تعديل تصنيف في ({domain_text}): {cat.name_ar}",
            metadata={"name": cat.name_ar, "domain": cat.domain},
            request=self.request,
        )

    def perform_destroy(self, instance):
        domain_text = "قسم التسليح" if instance.domain == "armory" else "المخازن العامة"
        log_activity(
            actor=self.request.user,
            action="inventory_category_delete",
            target_model="InventoryCategory",
            target_id=instance.id,
            description=f"حذف تصنيف من ({domain_text}): {instance.name_ar}",
            request=self.request,
        )
        instance.soft_delete()


class InventoryItemViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, HasPermission]
    permission_map = {
        "list": ["equipment.view", "equipment.manage", "transportation.view", "transportation.manage"],
        "retrieve": ["equipment.view", "equipment.manage", "transportation.view", "transportation.manage"],
        "create": ["equipment.manage"],
        "update": ["equipment.manage"],
        "partial_update": ["equipment.manage"],
        "destroy": ["equipment.manage"],
        "assign_custody": ["equipment.manage"],
        "release_custody": ["equipment.manage"],
        "mark_damaged": ["equipment.manage"],
    }
    queryset = (
        InventoryItem.objects.select_related("category", "faction", "assigned_member").all()
    )
    serializer_class = InventoryItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        domain_param = self.request.query_params.get("domain")
        if domain_param:
            qs = qs.filter(domain=domain_param)

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        category_param = self.request.query_params.get("category")
        if category_param:
            qs = qs.filter(category_id=category_param)

        faction_param = self.request.query_params.get("faction")
        if faction_param:
            qs = qs.filter(faction_id=faction_param)

        search_param = self.request.query_params.get("search")
        if search_param:
            qs = qs.filter(
                Q(name__icontains=search_param)
                | Q(serial_number__icontains=search_param)
                | Q(item_code__icontains=search_param)
                | Q(caliber__icontains=search_param)
                | Q(model_name__icontains=search_param)
            )
        return qs

    def perform_create(self, serializer):
        category = serializer.validated_data.get("category")
        domain = serializer.validated_data.get("domain") or (category.domain if category else "inventory")
        item = serializer.save(created_by=self.request.user, domain=domain)

        # Ensure available_quantity is coherent with total_quantity if not set
        if item.available_quantity == 0 and item.assigned_quantity == 0 and item.damaged_quantity == 0:
            item.available_quantity = item.total_quantity
            item.save(update_fields=["available_quantity"])

        action_name = "armory_weapon_create" if item.domain == "armory" else "inventory_create"
        desc_prefix = "تسجيل سلاح/ذخيرة جديدة بقسم التسليح" if item.domain == "armory" else "تسجيل صنف/مهمات جديدة بالمخزن العام"

        log_activity(
            actor=self.request.user,
            action=action_name,
            target_model="InventoryItem",
            target_id=item.id,
            description=f"{desc_prefix}: {item.name} (رقم: {item.serial_number or item.item_code or '—'})",
            metadata={
                "item_name": item.name,
                "item_code": item.item_code or "",
                "serial_number": item.serial_number or "",
                "caliber": item.caliber or "",
                "domain": item.domain,
                "total_quantity": item.total_quantity,
                "status": item.status,
            },
            request=self.request,
        )

    def perform_update(self, serializer):
        category = serializer.validated_data.get("category")
        domain = serializer.validated_data.get("domain") or (category.domain if category else None)
        if domain:
            item = serializer.save(updated_by=self.request.user, domain=domain)
        else:
            item = serializer.save(updated_by=self.request.user)

        action_name = "armory_weapon_update" if item.domain == "armory" else "inventory_update"
        desc_prefix = "تعديل بيانات سلاح/ذخيرة" if item.domain == "armory" else "تعديل بيانات صنف/مهمات"

        log_activity(
            actor=self.request.user,
            action=action_name,
            target_model="InventoryItem",
            target_id=item.id,
            description=f"{desc_prefix}: {item.name} (رقم: {item.serial_number or item.item_code or '—'})",
            metadata={
                "item_name": item.name,
                "serial_number": item.serial_number or "",
                "status": item.status,
                "domain": item.domain,
            },
            request=self.request,
        )

    def perform_destroy(self, instance):
        action_name = "armory_weapon_delete" if instance.domain == "armory" else "inventory_delete"
        desc_prefix = "حذف سجل سلاح/ذخيرة" if instance.domain == "armory" else "حذف سجل صنف/مهمات"

        log_activity(
            actor=self.request.user,
            action=action_name,
            target_model="InventoryItem",
            target_id=instance.id,
            description=f"{desc_prefix}: {instance.name} (رقم: {instance.serial_number or instance.item_code or '—'})",
            request=self.request,
        )
        instance.soft_delete()

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
        action_type = "تسليم عهدة سلاح" if item.domain == "armory" else "تسليم عهدة مهمات"

        log_activity(
            actor=request.user,
            action="inventory_custody_assign",
            target_model="InventoryItem",
            target_id=item.id,
            description=f"{action_type} ({qty}) من ({item.name}) للفرد ({member_name})",
            metadata={
                "item_name": item.name,
                "quantity": qty,
                "serial_number": item.serial_number or "",
                "caliber": item.caliber or "",
                "domain": item.domain,
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
        member_id = request.data.get("member_id")

        if member_id:
            from apps.members.models import Member
            member = Member.objects.filter(id=member_id).first()
        else:
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

        target_dep = "خزينة السلاح" if item.domain == "armory" else "المخزن الرئيسي"

        log_activity(
            actor=request.user,
            action="inventory_custody_release",
            target_model="InventoryItem",
            target_id=item.id,
            description=f"إرجاع عهدة ({qty_to_return}) من ({item.name}) إلى {target_dep}" + (f" (كانت بحوزة {member_name})" if member_name else ""),
            metadata={
                "item_name": item.name,
                "quantity": qty_to_return,
                "serial_number": item.serial_number or "",
                "domain": item.domain,
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
            description=f"تسجيل تالف/مكهن ({qty_damaged}) من ({item.name})" + (f" (من عهدة {member_name})" if member_name else " (من المستودع)"),
            metadata={
                "item_name": item.name,
                "quantity": qty_damaged,
                "source": source,
                "domain": item.domain,
                "notes": notes,
            },
            request=request,
        )

        return Response(InventoryItemSerializer(item).data)


class CustodyRecordViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, HasPermission]
    permission_map = {
        "list": ["equipment.view", "equipment.manage"],
        "retrieve": ["equipment.view", "equipment.manage"],
        "create": ["equipment.manage"],
        "update": ["equipment.manage"],
        "partial_update": ["equipment.manage"],
        "destroy": ["equipment.manage"],
    }
    queryset = CustodyRecord.objects.select_related("item", "member", "faction").all()
    serializer_class = CustodyRecordSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        domain_param = self.request.query_params.get("domain")
        if domain_param:
            qs = qs.filter(item__domain=domain_param)

        item_param = self.request.query_params.get("item")
        if item_param:
            qs = qs.filter(item_id=item_param)

        member_param = self.request.query_params.get("member")
        if member_param:
            qs = qs.filter(member_id=member_param)

        return qs
