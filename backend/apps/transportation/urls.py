from rest_framework.routers import DefaultRouter

from apps.transportation.views import (
    ExternalUnitViewSet,
    VehicleCustodyRecordViewSet,
    VehicleViewSet,
)

router = DefaultRouter()
router.register(r"transportation/external-units", ExternalUnitViewSet, basename="external-unit")
router.register(r"transportation/vehicles", VehicleViewSet, basename="vehicle")
router.register(r"transportation/vehicle-custody-records", VehicleCustodyRecordViewSet, basename="vehicle-custody-record")

urlpatterns = router.urls
