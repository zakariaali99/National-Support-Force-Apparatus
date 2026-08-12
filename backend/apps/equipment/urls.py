from rest_framework.routers import DefaultRouter

from apps.equipment.views import (
    InventoryCategoryViewSet,
    InventoryItemViewSet,
    CustodyRecordViewSet,
)

router = DefaultRouter()
router.register("equipment/categories", InventoryCategoryViewSet, basename="equipment-category")
router.register("equipment/items", InventoryItemViewSet, basename="equipment-item")
router.register("equipment/custody", CustodyRecordViewSet, basename="equipment-custody")

urlpatterns = router.urls
