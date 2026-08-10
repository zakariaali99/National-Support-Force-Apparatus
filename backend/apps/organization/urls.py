from rest_framework.routers import DefaultRouter

from apps.organization.views import DocumentTypeViewSet, FactionViewSet, RankViewSet

router = DefaultRouter()
router.register("ranks", RankViewSet, basename="rank")
router.register("factions", FactionViewSet, basename="faction")
router.register("document-types", DocumentTypeViewSet, basename="document-type")

urlpatterns = router.urls
