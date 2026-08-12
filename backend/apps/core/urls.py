from django.urls import include, path

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from apps.core.views.audit import ActivityLogViewSet, HistoryView
from apps.core.views.auth import LogoutView, MeView, ThrottledTokenObtainPairView
from apps.core.views.backup import (
    BackupDownloadView,
    BackupListView,
    BackupMergeView,
    BackupRestoreView,
    BackupRunView,
)
from apps.core.views.role import RoleViewSet
from apps.core.views.user import UserViewSet

router = DefaultRouter()
router.register("roles", RoleViewSet, basename="role")
router.register("users", UserViewSet, basename="user")
router.register("audit/activity", ActivityLogViewSet, basename="activity-log")

urlpatterns = [
    path("auth/login/", ThrottledTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("auth/logout/", LogoutView.as_view(), name="token_logout"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("audit/history/", HistoryView.as_view(), name="audit-history"),
    path("backups/", BackupListView.as_view(), name="backup-list"),
    path("backups/run/", BackupRunView.as_view(), name="backup-run"),
    path("backups/<int:pk>/download/", BackupDownloadView.as_view(), name="backup-download"),
    path("backups/<int:pk>/restore/", BackupRestoreView.as_view(), name="backup-restore"),
    path("backups/restore-upload/", BackupRestoreView.as_view(), name="backup-restore-upload"),
    path("backups/<int:pk>/merge/", BackupMergeView.as_view(), name="backup-merge"),
    path("backups/merge-upload/", BackupMergeView.as_view(), name="backup-merge-upload"),
    path("", include(router.urls)),
]