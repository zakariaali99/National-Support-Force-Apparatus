from rest_framework.routers import DefaultRouter

from apps.transportation.views import VehicleViewSet

router = DefaultRouter()
router.register(r"transportation/vehicles", VehicleViewSet, basename="vehicle")

urlpatterns = router.urls
