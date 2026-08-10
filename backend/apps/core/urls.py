from django.urls import include, path

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from apps.core.views.auth import LogoutView, MeView, ThrottledTokenObtainPairView
from apps.core.views.role import RoleViewSet
from apps.core.views.user import UserViewSet

router = DefaultRouter()
router.register("roles", RoleViewSet, basename="role")
router.register("users", UserViewSet, basename="user")

urlpatterns = [
    path("auth/login/", ThrottledTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("auth/logout/", LogoutView.as_view(), name="token_logout"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]