from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Additional Info", {"fields": ("phone", "user_type", "is_verified")}),
    )
    list_display = ("username", "email", "phone", "user_type", "is_verified")
    list_filter = ("user_type", "is_verified")