from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.members.field_registry import FIELD_BY_KEY
from apps.members.models import FieldRequirement


class FieldRequirementSerializer(serializers.ModelSerializer):
    label_ar = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    lockable = serializers.SerializerMethodField()

    class Meta:
        model = FieldRequirement
        fields = ["id", "field_key", "label_ar", "type", "lockable", "is_required", "is_visible", "order"]
        read_only_fields = ["id", "field_key", "order"]

    @extend_schema_field(serializers.CharField())
    def get_label_ar(self, obj):
        return FIELD_BY_KEY.get(obj.field_key, {}).get("label_ar", obj.field_key)

    @extend_schema_field(serializers.CharField())
    def get_type(self, obj):
        return FIELD_BY_KEY.get(obj.field_key, {}).get("type", "text")

    @extend_schema_field(serializers.BooleanField())
    def get_lockable(self, obj):
        return FIELD_BY_KEY.get(obj.field_key, {}).get("lockable", True)

    def validate(self, attrs):
        registry_entry = FIELD_BY_KEY.get(self.instance.field_key) if self.instance else None
        if registry_entry and not registry_entry["lockable"]:
            if attrs.get("is_required") is False:
                raise serializers.ValidationError("لا يمكن جعل هذا الحقل اختيارياً — إنه حقل أساسي في النظام.")
            if attrs.get("is_visible") is False:
                raise serializers.ValidationError("لا يمكن إخفاء هذا الحقل — إنه حقل أساسي في النظام.")
        return attrs
