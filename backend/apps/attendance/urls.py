from rest_framework.routers import DefaultRouter

from apps.attendance.views import DailyAttendanceViewSet, ShiftRosterGroupViewSet

router = DefaultRouter()
router.register(r"attendance/rosters", ShiftRosterGroupViewSet, basename="roster")
router.register(r"attendance/records", DailyAttendanceViewSet, basename="attendance")

urlpatterns = router.urls
