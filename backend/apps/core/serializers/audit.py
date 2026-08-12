from rest_framework import serializers

from apps.core.models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "actor",
            "actor_username",
            "actor_name",
            "action",
            "target_model",
            "target_id",
            "description",
            "metadata",
            "ip_address",
            "created_at",
        ]
        read_only_fields = fields

    def get_actor_name(self, obj):
        if obj.actor:
            return obj.actor.full_name or obj.actor.username
        return obj.actor_username or "النظام"
