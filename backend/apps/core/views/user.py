from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.core.models.user import User
from apps.core.permissions.classes import HasPermission
from apps.core.serializers.user import AssignableUserSerializer, UserSerializer


class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [HasPermission]
    permission_map = {
        "list": "users.manage",
        "retrieve": "users.manage",
        "create": "users.manage",
        "update": "users.manage",
        "partial_update": "users.manage",
        "destroy": "users.manage",
        # Any authenticated user can look up assignee candidates (task
        # assignment, future approval routing) — see AssignableUserSerializer
        # for why this is a lower bar than the rest of user management.
        "assignable": None,
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active", "roles"]
    search_fields = ["username", "email", "first_name", "last_name", "phone"]
    ordering_fields = ["username", "date_joined"]
    ordering = ["username"]

    def perform_destroy(self, instance):
        # Users aren't a BaseModel subclass (see models/user.py) — deactivate
        # rather than hard-delete, so history/activity rows attributed to
        # this user keep a resolvable actor.
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    @action(detail=False, methods=["get"])
    def assignable(self, request):
        users = User.objects.filter(is_active=True).order_by("first_name", "last_name")
        return Response(AssignableUserSerializer(users, many=True).data)
