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
router.register("inventory/categories", InventoryCategoryViewSet, basename="inventory-category")
router.register("inventory/items", InventoryItemViewSet, basename="inventory-item")
router.register("inventory/custody", CustodyRecordViewSet, basename="inventory-custody")

urlpatterns = router.urls
