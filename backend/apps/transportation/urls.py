from rest_framework.routers import DefaultRouter

from apps.transportation.views import ExternalUnitViewSet, VehicleViewSet

router = DefaultRouter()
router.register(r"transportation/external-units", ExternalUnitViewSet, basename="external-unit")
router.register(r"transportation/vehicles", VehicleViewSet, basename="vehicle")

urlpatterns = router.urls
