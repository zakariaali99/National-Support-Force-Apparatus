import uuid
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.text import slugify
from rest_framework import serializers

from apps.core.models.role import Role


class RoleSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Role
        fields = [
            "id",
            "name",
            "name_ar",
            "description",
            "permissions",
            "scope",
            "is_system",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_system", "created_at", "updated_at"]

    def create(self, validated_data):
        if not validated_data.get("name"):
            base_slug = slugify(validated_data.get("name_ar", ""), allow_unicode=True) or "role"
            code = f"{base_slug}-{uuid.uuid4().hex[:6]}"
            while Role.objects.filter(name=code).exists():
                code = f"{base_slug}-{uuid.uuid4().hex[:6]}"
            validated_data["name"] = code
        return super().create(validated_data)

    def validate_permissions(self, value):
        try:
            Role(permissions=value).clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return value
