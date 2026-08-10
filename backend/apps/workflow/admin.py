from django.contrib import admin

from apps.workflow.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("recipient", "verb", "message", "is_read", "created_at")
    list_filter = ("verb", "is_read")
