import mimetypes
from django.http import FileResponse, Http404
from rest_framework.views import APIView

from apps.core.permissions.classes import HasPermission, ScopedQuerysetMixin
from apps.core.viewsets import SoftDeleteModelViewSet
from apps.members.models.pledge import MemberPledge
from apps.members.serializers.pledge import MemberPledgeSerializer


class MemberPledgeViewSet(ScopedQuerysetMixin, SoftDeleteModelViewSet):
    queryset = MemberPledge.objects.select_related("member", "created_by").all()
    serializer_class = MemberPledgeSerializer
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


class MemberPledgeDownloadView(APIView):
    permission_classes = [HasPermission]
    permission_map = {"get": "member.view"}

    def get(self, request, pk):
        try:
            pledge = MemberPledge.objects.select_related("member").get(pk=pk)
        except MemberPledge.DoesNotExist as exc:
            raise Http404 from exc

        if not pledge.attachment:
            raise Http404("No attachment on this pledge.")

        f = pledge.attachment.storage.open(pledge.attachment.name, "rb")
        mime_type, _ = mimetypes.guess_type(pledge.original_name or pledge.attachment.name)
        mime_type = mime_type or "application/octet-stream"

        return FileResponse(
            f,
            content_type=mime_type,
            as_attachment=True,
            filename=pledge.original_name or "pledge-attachment",
        )
