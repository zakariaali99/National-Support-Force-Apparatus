from django.http import FileResponse, Http404

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.core.permissions.classes import HasPermission, user_can_access_faction
from apps.core.viewsets import SoftDeleteModelViewSet
from apps.members.models import MemberDocument
from apps.members.serializers.document import MemberDocumentSerializer


class MemberDocumentViewSet(SoftDeleteModelViewSet):
    queryset = MemberDocument.objects.select_related("document_type", "member").all()
    serializer_class = MemberDocumentSerializer
    permission_classes = [HasPermission]
    permission_map = {
        "list": "document.view",
        "retrieve": "document.view",
        "create": "document.upload",
        "update": "document.upload",
        "partial_update": "document.upload",
        "destroy": "document.upload",
    }
    filterset_fields = ["member", "document_type"]

    def get_queryset(self):
        qs = super().get_queryset()
        member_id = self.request.query_params.get("member")
        if member_id:
            qs = qs.filter(member_id=member_id)
        return qs


def _log_document_access(request, document, action):
    from apps.core.activity import log_activity

    log_activity(
        actor=request.user,
        action=action,
        target_model="MemberDocument",
        target_id=document.id,
        description=f"{document.document_type.name_ar} — {document.member.full_name}",
        metadata={"member_id": document.member_id},
        request=request,
    )


class MemberDocumentDownloadView(APIView):
    """Serves a document's bytes through an authenticated view rather than
    exposing PRIVATE_MEDIA_ROOT via a public URL (see apps.core.storage).
    This is the ONLY path by which a passport/national ID/birth certificate
    scan ever leaves the server.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: OpenApiTypes.BINARY})
    def get(self, request, pk):
        try:
            document = MemberDocument.objects.select_related("member", "member__faction").get(pk=pk)
        except MemberDocument.DoesNotExist as exc:
            raise Http404 from exc

        if not request.user.has_permission("document.view"):
            raise PermissionDenied("لا تملك صلاحية عرض المستندات.")
        if not user_can_access_faction(request.user, document.member.faction_id):
            raise PermissionDenied("لا تملك صلاحية عرض مستندات هذا الفصيل.")

        _log_document_access(request, document, "document_download")

        response = FileResponse(
            document.file.open("rb"),
            content_type=document.content_type,
            filename=document.original_name,
        )
        response["X-Content-Type-Options"] = "nosniff"
        return response
