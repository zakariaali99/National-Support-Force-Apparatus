from rest_framework import serializers

from apps.core.models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "actor",
            "actor_username",
            "action",
            "target_model",
            "target_id",
            "description",
            "metadata",
            "ip_address",
            "created_at",
        ]
        read_only_fields = fields
