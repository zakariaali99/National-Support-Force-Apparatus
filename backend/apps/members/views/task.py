from apps.core.activity import log_activity
from apps.core.permissions.classes import HasPermission, ScopedQuerysetMixin
from apps.core.viewsets import SoftDeleteModelViewSet
from apps.members.models import MemberTask
from apps.members.serializers.task import MemberTaskSerializer


class MemberTaskViewSet(ScopedQuerysetMixin, SoftDeleteModelViewSet):
    queryset = MemberTask.objects.select_related("member", "assigned_to", "assigned_by").all()
    serializer_class = MemberTaskSerializer
    permission_classes = [HasPermission]
    permission_map = {
        "list": "member.view",
        "retrieve": "member.view",
        "create": "task.assign",
        "update": "task.assign",
        "partial_update": "task.assign",
        "destroy": "task.assign",
    }
    faction_lookup = "member__faction"
    filterset_fields = ["member", "assigned_to", "status", "priority"]

    def get_queryset(self):
        qs = super().get_queryset()
        mine = self.request.query_params.get("assigned_to_me")
        if mine:
            qs = qs.filter(assigned_to=self.request.user)
        return qs

    def perform_create(self, serializer):
        task = serializer.save(assigned_by=self.request.user)
        try:
            log_activity(
                actor=self.request.user,
                action="member_task_assign",
                target_model="Member",
                target_id=task.member_id,
                description=f"إسناد وتكليف مهمة ({task.title}) للفرد: {task.member.full_name}",
                metadata={"task_id": task.id, "target_name": task.member.full_name},
                request=self.request,
            )
        except Exception:
            pass

    def perform_update(self, serializer):
        task = serializer.save()
        try:
            log_activity(
                actor=self.request.user,
                action="member_task_update",
                target_model="Member",
                target_id=task.member_id,
                description=f"تحديث حالة مهمة ({task.title}) للفرد: {task.member.full_name}",
                metadata={"task_id": task.id, "target_name": task.member.full_name, "status": task.status},
                request=self.request,
            )
        except Exception:
            pass

    def perform_destroy(self, instance):
        member_name = instance.member.full_name if instance.member else ""
        member_id = instance.member_id
        task_title = instance.title
        instance.soft_delete()
        try:
            log_activity(
                actor=self.request.user,
                action="member_task_delete",
                target_model="Member",
                target_id=member_id,
                description=f"حذف مهمة ({task_title}) من ملف الفرد: {member_name}",
                metadata={"target_name": member_name},
                request=self.request,
            )
        except Exception:
            pass
