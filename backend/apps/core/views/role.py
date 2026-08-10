from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.core.models.role import Role
from apps.core.permissions.classes import HasPermission
from apps.core.permissions.registry import PERMISSION_GROUPS
from apps.core.serializers.role import RoleSerializer


class RoleViewSet(ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [HasPermission]
    required_permission = "roles.manage"

    def perform_destroy(self, instance):
        if instance.is_system:
            raise PermissionDenied("لا يمكن حذف دور أساسي في النظام.")
        instance.delete()

    @action(detail=False, methods=["get"], url_path="permissions")
    def available_permissions(self, request):
        """The full permission registry, grouped for a checkbox UI (Phase 3
        Settings > Roles screen). Kept on the Role viewset rather than a
        standalone endpoint since it's only ever consumed alongside role
        editing.
        """
        return Response(PERMISSION_GROUPS)
