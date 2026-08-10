from rest_framework import serializers

from apps.workflow.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "verb",
            "message",
            "target_model",
            "target_object_id",
            "is_read",
            "created_at",
        ]
        read_only_fields = fields
