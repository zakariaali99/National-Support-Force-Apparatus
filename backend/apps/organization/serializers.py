from rest_framework import serializers

from apps.organization.models import DocumentType, Faction, Rank


class RankSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rank
        fields = ["id", "code", "name_ar", "order", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class FactionSerializer(serializers.ModelSerializer):
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


class DocumentTypeSerializer(serializers.ModelSerializer):
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

    def validate_code(self, value):
        # is_system rows are seeded with codes the Member model / print
        # pipeline rely on (birth_certificate, passport, national_id_paper)
        # — renaming one out from under them would silently break lookups.
        if self.instance and self.instance.is_system and value != self.instance.code:
            raise serializers.ValidationError(
                "لا يمكن تغيير رمز نوع مستند أساسي في النظام."
            )
        return value
