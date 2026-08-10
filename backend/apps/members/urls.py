from django.urls import path

from rest_framework.routers import DefaultRouter

from apps.members.views.document import MemberDocumentDownloadView, MemberDocumentViewSet
from apps.members.views.evaluation import MemberEvaluationViewSet
from apps.members.views.field_requirement import FieldRequirementViewSet
from apps.members.views.member import MemberViewSet
from apps.members.views.note import MemberNoteViewSet
from apps.members.views.task import MemberTaskViewSet
from apps.members.views.vacation import VacationRequestViewSet, VacationTransactionViewSet

router = DefaultRouter()
router.register("members", MemberViewSet, basename="member")
router.register("member-documents", MemberDocumentViewSet, basename="member-document")
router.register("member-notes", MemberNoteViewSet, basename="member-note")
router.register("member-tasks", MemberTaskViewSet, basename="member-task")
router.register("member-evaluations", MemberEvaluationViewSet, basename="member-evaluation")
router.register("vacation-requests", VacationRequestViewSet, basename="vacation-request")
router.register("vacation-transactions", VacationTransactionViewSet, basename="vacation-transaction")
router.register(
    "settings/field-requirements", FieldRequirementViewSet, basename="field-requirement"
)

urlpatterns = router.urls + [
    path("documents/<int:pk>/download/", MemberDocumentDownloadView.as_view(), name="document-download"),
]
