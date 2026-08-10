from django.utils import timezone

from rest_framework import serializers

from apps.members.models import MemberTask


class MemberTaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source="assigned_to.get_full_name", read_only=True)
    member_name = serializers.CharField(source="member.full_name", read_only=True)

    class Meta:
        model = MemberTask
        fields = [
            "id",
            "member",
            "member_name",
            "title",
            "description",
            "assigned_to",
            "assigned_to_name",
            "assigned_by",
            "due_date",
            "priority",
            "status",
            "completed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "assigned_by", "completed_at", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["assigned_by"] = request.user
        instance = super().create(validated_data)
        self._notify_assignee(instance)
        return instance

    def update(self, instance, validated_data):
        previous_assignee_id = instance.assigned_to_id
        new_status = validated_data.get("status", instance.status)
        if new_status == "done" and instance.status != "done":
            validated_data["completed_at"] = timezone.now()
        elif new_status != "done":
            validated_data["completed_at"] = None
        instance = super().update(instance, validated_data)
        if instance.assigned_to_id and instance.assigned_to_id != previous_assignee_id:
            self._notify_assignee(instance)
        return instance

    def _notify_assignee(self, task):
        if not task.assigned_to_id:
            return
        from apps.workflow.models import Notification

        Notification.objects.create(
            recipient_id=task.assigned_to_id,
            verb="task_assigned",
            message=f"تم إسناد مهمة جديدة إليك: {task.title}",
            target_model="MemberTask",
            target_object_id=task.id,
        )
