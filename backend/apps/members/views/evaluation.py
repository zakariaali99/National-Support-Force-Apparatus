from apps.core.permissions.classes import HasPermission, ScopedQuerysetMixin
from apps.core.viewsets import SoftDeleteModelViewSet
from apps.members.models import MemberEvaluation
from apps.members.serializers.evaluation import MemberEvaluationSerializer


class MemberEvaluationViewSet(ScopedQuerysetMixin, SoftDeleteModelViewSet):
    queryset = MemberEvaluation.objects.select_related("member", "evaluator").all()
    serializer_class = MemberEvaluationSerializer
    permission_classes = [HasPermission]
    permission_map = {
        "list": "member.view",
        "retrieve": "member.view",
        "create": "member.edit",
        "update": "member.edit",
        "partial_update": "member.edit",
        "destroy": "member.edit",
    }
    faction_lookup = "member__faction"
    filterset_fields = ["member"]
