from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.core.activity import log_activity
from apps.core.permissions.registry import ALL_CODENAMES


class ThrottledTokenObtainPairView(TokenObtainPairView):
    """Login, rate-limited.

    TokenObtainPairView ships with no throttle, which makes it an open
    brute-force target — REST_FRAMEWORK.DEFAULT_THROTTLE_RATES defines a
    "login" scope, this just opts the view into it.
    """

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request, *args, **kwargs):
        # TokenObtainPairView.post() raises AuthenticationFailed directly
        # (via serializer.is_valid(raise_exception=True)) rather than
        # returning a non-200 Response — the exception propagates straight
        # past this method to DRF's dispatch(), so a bad-credentials
        # attempt must be caught here, not detected via response.status_code.
        try:
            response = super().post(request, *args, **kwargs)
        except Exception:
            log_activity(
                action="login_failed",
                description=f"محاولة دخول فاشلة: {request.data.get('username', '')}",
                request=request,
            )
            raise
        if response.status_code != 200:
            log_activity(
                action="login_failed",
                description=f"محاولة دخول فاشلة: {request.data.get('username', '')}",
                request=request,
            )
        return response


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class LogoutView(APIView):
    """Blacklist the caller's refresh token.

    SIMPLE_JWT has ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION enabled
    and rest_framework_simplejwt.token_blacklist is installed, but nothing
    used it — there was no logout endpoint. Without this, a "logged out"
    refresh token remains valid for its full 7-day lifetime.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(request=LogoutSerializer, responses={205: None})
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            return Response(
                {"detail": "Invalid or already-blacklisted token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


class RoleSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    name_ar = serializers.CharField()


class MeSerializer(serializers.Serializer):
    """Shape of GET /api/auth/me/ — the frontend's single source of truth
    for "who am I and what can I do", fetched once on load and used to
    gate UI (show/hide nav items, buttons) without re-deriving permission
    logic client-side.
    """

    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    full_name = serializers.CharField()
    faction_name = serializers.CharField(allow_blank=True)
    email = serializers.CharField()
    is_superuser = serializers.BooleanField()
    roles = RoleSummarySerializer(many=True)
    permissions = serializers.ListField(child=serializers.CharField())


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=MeSerializer)
    def get(self, request):
        user = request.user
        roles = list(user.roles.all())
        factions = list(user.factions.all())
        faction_name = factions[0].name_ar if factions else ""
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        permissions = (
            sorted(ALL_CODENAMES)
            if user.is_superuser
            else sorted({p for role in roles for p in (role.permissions or [])})
        )
        data = {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": full_name,
            "faction_name": faction_name,
            "email": user.email,
            "is_superuser": user.is_superuser,
            "roles": [{"id": r.id, "name": r.name, "name_ar": r.name_ar} for r in roles],
            "permissions": permissions,
        }
        return Response(MeSerializer(data).data)
