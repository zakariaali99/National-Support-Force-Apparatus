from apps.core.activity import log_activity
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

    def perform_create(self, serializer):
        note = serializer.save(author=self.request.user)
        try:
            log_activity(
                actor=self.request.user,
                action="member_note_create",
                target_model="Member",
                target_id=note.member_id,
                description=f"إضافة ملاحظة إدارية لملف الفرد: {note.member.full_name}",
                metadata={"note_id": note.id, "target_name": note.member.full_name},
                request=self.request,
            )
        except Exception:
            pass

    def perform_destroy(self, instance):
        member_name = instance.member.full_name if instance.member else ""
        member_id = instance.member_id
        instance.soft_delete()
        try:
            log_activity(
                actor=self.request.user,
                action="member_note_delete",
                target_model="Member",
                target_id=member_id,
                description=f"حذف ملاحظة إدارية من ملف الفرد: {member_name}",
                metadata={"target_name": member_name},
                request=self.request,
            )
        except Exception:
            pass
