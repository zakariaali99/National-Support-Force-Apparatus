import uuid
from django.utils.text import slugify
from rest_framework import serializers

from apps.equipment.models import CustodyRecord, InventoryCategory, InventoryItem


class InventoryCategorySerializer(serializers.ModelSerializer):
    code = serializers.CharField(required=False, allow_blank=True)
    domain_display = serializers.CharField(source="get_domain_display", read_only=True)
    category_type_display = serializers.CharField(source="get_category_type_display", read_only=True)
    items_count = serializers.IntegerField(source="items.count", read_only=True)

    class Meta:
        model = InventoryCategory
        fields = [
            "id",
            "code",
            "name_ar",
            "domain",
            "domain_display",
            "category_type",
            "category_type_display",
            "description",
            "items_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def create(self, validated_data):
        if not validated_data.get("code"):
            base_slug = slugify(validated_data.get("name_ar", ""), allow_unicode=True) or "cat"
            validated_data["code"] = f"{base_slug}-{uuid.uuid4().hex[:6]}"
        return super().create(validated_data)


class InventoryItemSerializer(serializers.ModelSerializer):
    domain_display = serializers.CharField(source="get_domain_display", read_only=True)
    category_name = serializers.CharField(source="category.name_ar", read_only=True)
    category_type = serializers.CharField(source="category.category_type", read_only=True)
    category_type_display = serializers.CharField(source="category.get_category_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    faction_name = serializers.CharField(source="faction.name_ar", read_only=True)
    assigned_member_name = serializers.CharField(source="assigned_member.full_name", read_only=True)
    assigned_member_force_number = serializers.CharField(source="assigned_member.force_number", read_only=True)

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "category",
            "category_name",
            "category_type",
            "category_type_display",
            "domain",
            "domain_display",
            "name",
            "item_code",
            "serial_number",
            "size_spec",
            "caliber",
            "model_name",
            "total_quantity",
            "available_quantity",
            "assigned_quantity",
            "damaged_quantity",
            "status",
            "status_display",
            "faction",
            "faction_name",
            "assigned_member",
            "assigned_member_name",
            "assigned_member_force_number",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class CustodyRecordSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_serial = serializers.CharField(source="item.serial_number", read_only=True)
    item_caliber = serializers.CharField(source="item.caliber", read_only=True)
    item_domain = serializers.CharField(source="item.domain", read_only=True)
    member_name = serializers.CharField(source="member.full_name", read_only=True)
    member_force_number = serializers.CharField(source="member.force_number", read_only=True)
    faction_name = serializers.CharField(source="faction.name_ar", read_only=True)
    action_display = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = CustodyRecord
        fields = [
            "id",
            "item",
            "item_name",
            "item_serial",
            "item_caliber",
            "item_domain",
            "member",
            "member_name",
            "member_force_number",
            "faction",
            "faction_name",
            "action",
            "action_display",
            "quantity",
            "assigned_date",
            "return_date",
            "notes",
            "created_at",
        ]
        read_only_fields = ["created_at"]
