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
            "user_agent",
            "created_at",
        ]
        read_only_fields = fields

    def get_actor_name(self, obj):
        if obj.actor:
            return obj.actor.full_name or obj.actor.username
        return obj.actor_username or "النظام"

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get("request")
        is_superuser = bool(request and getattr(request.user, "is_superuser", False))
        if not is_superuser:
            ret["ip_address"] = None
            ret["user_agent"] = None
            # Only retain safe business metadata fields for regular staff/admins
            safe_keys = {"item_name", "target_name", "serial_number", "assigned_member"}
            if isinstance(ret.get("metadata"), dict):
                ret["metadata"] = {k: v for k, v in ret["metadata"].items() if k in safe_keys}
            else:
                ret["metadata"] = {}
        return ret
