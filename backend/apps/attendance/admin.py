from django.contrib import admin

from apps.attendance.models import DailyAttendance, ShiftRosterGroup


@admin.register(ShiftRosterGroup)
class ShiftRosterGroupAdmin(admin.ModelAdmin):
    list_display = ["name_ar", "faction", "pattern", "cycle_days", "group_offset", "is_active"]
    list_filter = ["pattern", "faction", "is_active"]
    search_fields = ["name_ar", "faction__name_ar"]


@admin.register(DailyAttendance)
class DailyAttendanceAdmin(admin.ModelAdmin):
    list_display = [
        "member",
        "date",
        "status",
        "expected_status",
        "late_hours",
        "early_departure_hours",
        "excused_hours",
        "deducted_vacation_days",
    ]
    list_filter = ["status", "date", "member__faction"]
    search_fields = ["member__full_name", "member__force_number"]
