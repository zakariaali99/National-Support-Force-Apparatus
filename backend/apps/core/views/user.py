from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.viewsets import ModelViewSet

from apps.core.models.user import User
from apps.core.permissions.classes import HasPermission
from apps.core.serializers.user import UserSerializer


class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [HasPermission]
    required_permission = "users.manage"
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active", "roles"]
    search_fields = ["username", "email", "first_name", "last_name", "phone"]
    ordering_fields = ["username", "date_joined"]

    def perform_destroy(self, instance):
        # Users aren't a BaseModel subclass (see models/user.py) — deactivate
        # rather than hard-delete, so history/activity rows attributed to
        # this user keep a resolvable actor.
        instance.is_active = False
        instance.save(update_fields=["is_active"])
