from apps.core.activity import log_activity
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

    def perform_create(self, serializer):
        evaluation = serializer.save(evaluator=self.request.user)
        try:
            log_activity(
                actor=self.request.user,
                action="member_evaluation_create",
                target_model="Member",
                target_id=evaluation.member_id,
                description=f"إضافة تقييم كفاءة وسلوك للفرد: {evaluation.member.full_name}",
                metadata={"evaluation_id": evaluation.id, "target_name": evaluation.member.full_name},
                request=self.request,
            )
        except Exception:
            pass
