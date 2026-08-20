import uuid
from django.utils.text import slugify
from rest_framework import serializers

from apps.organization.models import DocumentType, Faction, Rank


class RankSerializer(serializers.ModelSerializer):
    code = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Rank
        fields = ["id", "code", "name_ar", "order", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        if not validated_data.get("code"):
            base_slug = slugify(validated_data.get("name_ar", ""), allow_unicode=True) or "rank"
            code = f"{base_slug}-{uuid.uuid4().hex[:6]}"
            while Rank.objects.filter(code=code).exists():
                code = f"{base_slug}-{uuid.uuid4().hex[:6]}"
            validated_data["code"] = code
        return super().create(validated_data)


class FactionSerializer(serializers.ModelSerializer):
    code = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Faction
        fields = [
            "id",
            "code",
            "name_ar",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        if not validated_data.get("code"):
            base_slug = slugify(validated_data.get("name_ar", ""), allow_unicode=True) or "faction"
            code = f"{base_slug}-{uuid.uuid4().hex[:6]}"
            while Faction.objects.filter(code=code).exists():
                code = f"{base_slug}-{uuid.uuid4().hex[:6]}"
            validated_data["code"] = code
        return super().create(validated_data)


class DocumentTypeSerializer(serializers.ModelSerializer):
    code = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = DocumentType
        fields = [
            "id",
            "code",
            "name_ar",
            "requires_expiry",
            "expiry_warn_days",
            "allow_multiple",
            "is_printable",
            "print_order",
            "is_system",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_system", "created_at", "updated_at"]

    def create(self, validated_data):
        if not validated_data.get("code"):
            base_slug = slugify(validated_data.get("name_ar", ""), allow_unicode=True) or "doc"
            code = f"{base_slug}-{uuid.uuid4().hex[:6]}"
            while DocumentType.objects.filter(code=code).exists():
                code = f"{base_slug}-{uuid.uuid4().hex[:6]}"
            validated_data["code"] = code
        return super().create(validated_data)

    def validate_code(self, value):
        # is_system rows are seeded with codes the Member model / print
        # pipeline rely on (birth_certificate, passport, national_id_paper)
        # — renaming one out from under them would silently break lookups.
        if self.instance and self.instance.is_system and value != self.instance.code:
            raise serializers.ValidationError(
                "لا يمكن تغيير رمز نوع مستند أساسي في النظام."
            )
        return value
