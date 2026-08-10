from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import serializers

from apps.core.models.role import Role


class RoleSerializer(serializers.ModelSerializer):
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

    def validate_permissions(self, value):
        try:
            Role(permissions=value).clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return value
