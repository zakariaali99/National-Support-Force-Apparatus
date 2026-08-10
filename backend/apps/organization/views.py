from rest_framework.exceptions import PermissionDenied

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter

from apps.core.permissions.classes import HasPermission
from apps.core.viewsets import SoftDeleteModelViewSet
from apps.organization.models import DocumentType, Faction, Rank
from apps.organization.serializers import (
    DocumentTypeSerializer,
    FactionSerializer,
    RankSerializer,
)

# Reads are open to any authenticated user (ranks/factions/document types
# populate dropdowns throughout the app); writes require organization.manage.
_LOOKUP_PERMISSION_MAP = {
    "list": None,
    "retrieve": None,
    "create": "organization.manage",
    "update": "organization.manage",
    "partial_update": "organization.manage",
    "destroy": "organization.manage",
}


class RankViewSet(SoftDeleteModelViewSet):
    queryset = Rank.objects.all()
    serializer_class = RankSerializer
    permission_classes = [HasPermission]
    permission_map = _LOOKUP_PERMISSION_MAP
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["name_ar", "code"]
    ordering_fields = ["order", "name_ar"]


class FactionViewSet(SoftDeleteModelViewSet):
    queryset = Faction.objects.all()
    serializer_class = FactionSerializer
    permission_classes = [HasPermission]
    permission_map = _LOOKUP_PERMISSION_MAP
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["name_ar", "code"]
    ordering_fields = ["name_ar"]


class DocumentTypeViewSet(SoftDeleteModelViewSet):
    queryset = DocumentType.objects.all()
    serializer_class = DocumentTypeSerializer
    permission_classes = [HasPermission]
    permission_map = _LOOKUP_PERMISSION_MAP
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_printable"]
    search_fields = ["name_ar", "code"]
    ordering_fields = ["print_order", "name_ar"]

    def perform_destroy(self, instance):
        if instance.is_system:
            raise PermissionDenied("لا يمكن حذف نوع مستند أساسي في النظام.")
        super().perform_destroy(instance)
