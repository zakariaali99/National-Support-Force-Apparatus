from django.contrib import admin

from apps.organization.models import DocumentType, Faction, Rank


@admin.register(Rank)
class RankAdmin(admin.ModelAdmin):
    list_display = ("name_ar", "code", "order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name_ar", "code")


@admin.register(Faction)
class FactionAdmin(admin.ModelAdmin):
    list_display = ("name_ar", "code", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name_ar", "code")


@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ("name_ar", "code", "requires_expiry", "is_printable", "is_system")
    list_filter = ("requires_expiry", "is_printable", "is_system")
    search_fields = ("name_ar", "code")
