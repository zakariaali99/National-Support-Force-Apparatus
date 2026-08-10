from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Role, User


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