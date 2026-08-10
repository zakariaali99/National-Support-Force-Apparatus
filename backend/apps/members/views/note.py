from apps.core.permissions.classes import HasPermission, ScopedQuerysetMixin
from apps.core.viewsets import SoftDeleteModelViewSet
from apps.members.models import MemberNote
from apps.members.serializers.note import MemberNoteSerializer


class MemberNoteViewSet(ScopedQuerysetMixin, SoftDeleteModelViewSet):
    queryset = MemberNote.objects.select_related("member", "author").all()
    serializer_class = MemberNoteSerializer
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
    filterset_fields = ["member", "is_pinned"]
