from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers

from apps.core.models.user import User


class UserSerializer(serializers.ModelSerializer):
    """Admin-facing user management serializer (Settings > System Users,
    frontend UI lands in Phase 3). Password is write-only and optional on
    update — omit it to leave the password unchanged.
    """

    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "is_active",
            "is_verified",
            "is_staff",
            "roles",
            "factions",
            "password",
            "last_login",
            "date_joined",
        ]
        read_only_fields = ["id", "last_login", "date_joined"]

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        roles = validated_data.pop("roles", [])
        factions = validated_data.pop("factions", [])
        if not password:
            raise serializers.ValidationError({"password": "Password is required for new users."})
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        user.roles.set(roles)
        user.factions.set(factions)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        roles = validated_data.pop("roles", None)
        factions = validated_data.pop("factions", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        if roles is not None:
            instance.roles.set(roles)
        if factions is not None:
            instance.factions.set(factions)
        return instance
