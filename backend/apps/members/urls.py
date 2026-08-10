from django.urls import path

from rest_framework.routers import DefaultRouter

from apps.members.views.document import MemberDocumentDownloadView, MemberDocumentViewSet
from apps.members.views.field_requirement import FieldRequirementViewSet
from apps.members.views.member import MemberViewSet

router = DefaultRouter()
router.register("members", MemberViewSet, basename="member")
router.register("member-documents", MemberDocumentViewSet, basename="member-document")
router.register(
    "settings/field-requirements", FieldRequirementViewSet, basename="field-requirement"
)

urlpatterns = router.urls + [
    path("documents/<int:pk>/download/", MemberDocumentDownloadView.as_view(), name="document-download"),
]
