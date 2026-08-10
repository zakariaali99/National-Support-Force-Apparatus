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
        # "My tasks" view: assigned-to-me, across factions the user can
        # otherwise see, ignoring faction scope narrowing further — the
        # scoping mixin already excludes factions the user has no access to.
        mine = self.request.query_params.get("assigned_to_me")
        if mine:
            qs = qs.filter(assigned_to=self.request.user)
        return qs
