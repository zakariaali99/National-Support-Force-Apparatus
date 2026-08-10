from django.contrib import admin

from apps.members.models import FieldRequirement, Member, MemberDocument


class MemberDocumentInline(admin.TabularInline):
    model = MemberDocument
    extra = 0
    fields = ("document_type", "original_name", "expiry_date", "is_current")
    readonly_fields = ("original_name",)


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "force_number",
        "national_number",
        "rank",
        "faction",
        "service_status",
        "approval_status",
    )
    list_filter = ("faction", "rank", "service_status", "approval_status")
    search_fields = ("first_name", "second_name", "third_name", "last_name", "force_number", "national_number")
    inlines = [MemberDocumentInline]


@admin.register(MemberDocument)
class MemberDocumentAdmin(admin.ModelAdmin):
    list_display = ("member", "document_type", "expiry_date", "is_current")
    list_filter = ("document_type", "is_current")


@admin.register(FieldRequirement)
class FieldRequirementAdmin(admin.ModelAdmin):
    list_display = ("field_key", "is_required", "is_visible", "order")
    list_filter = ("is_required", "is_visible")
    ordering = ("order",)
