from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import ActivityLog, BackupRecord, Role, ScheduledJobRun, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # user_type is `editable=False` (deprecated, see models/user.py) so it
    # must be declared read-only for the admin's fieldset validation to pass.
    fieldsets = UserAdmin.fieldsets + (
        ("Additional Info", {"fields": ("phone", "user_type", "is_verified")}),
        ("Access", {"fields": ("roles", "factions")}),
    )
    readonly_fields = ("user_type",)
    filter_horizontal = UserAdmin.filter_horizontal + ("roles", "factions")
    list_display = ("username", "email", "phone", "user_type", "is_verified")
    list_filter = ("user_type", "is_verified")


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name_ar", "name", "scope", "is_system")
    list_filter = ("scope", "is_system")
    search_fields = ("name_ar", "name")


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "actor_username", "action", "target_model", "target_id")
    list_filter = ("action", "target_model")
    search_fields = ("actor_username", "description")


@admin.register(ScheduledJobRun)
class ScheduledJobRunAdmin(admin.ModelAdmin):
    list_display = ("name", "period_key", "started_at", "finished_at", "success")
    list_filter = ("name", "success")


@admin.register(BackupRecord)
class BackupRecordAdmin(admin.ModelAdmin):
    list_display = ("created_at", "file_size", "encrypted", "created_by")