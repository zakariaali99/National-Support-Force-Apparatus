from django.core.cache import cache

from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.core.permissions.classes import HasPermission
from apps.members.models.field_requirement import FIELD_REQUIREMENTS_CACHE_KEY, FieldRequirement
from apps.members.serializers.field_requirement import FieldRequirementSerializer


class FieldRequirementViewSet(ModelViewSet):
    """Settings > Field Requirements. Rows are seeded by the
    sync_field_requirements command/migration, never created via the API —
    only GET (any authenticated user, needed to render the member form)
    and PATCH (settings.manage) are exposed.
    """

    queryset = FieldRequirement.objects.all()
    serializer_class = FieldRequirementSerializer
    permission_classes = [HasPermission]
    permission_map = {
        "list": None,
        "retrieve": None,
        "update": "settings.manage",
        "partial_update": "settings.manage",
    }
    http_method_names = ["get", "patch", "head", "options"]
    pagination_class = None

    def list(self, request, *args, **kwargs):
        cached = cache.get(FIELD_REQUIREMENTS_CACHE_KEY)
        if cached is None:
            serializer = self.get_serializer(self.get_queryset(), many=True)
            cached = serializer.data
            cache.set(FIELD_REQUIREMENTS_CACHE_KEY, cached, timeout=None)
        return Response(cached)
