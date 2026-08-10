from django.contrib import admin

from apps.members.models import (
    DocumentExpiryAlert,
    FieldRequirement,
    Member,
    MemberDocument,
    MemberEvaluation,
    MemberNote,
    MemberTask,
)
from apps.members.models.vacation import VacationRequest, VacationTransaction


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


@admin.register(MemberNote)
class MemberNoteAdmin(admin.ModelAdmin):
    list_display = ("member", "author", "is_pinned", "created_at")
    list_filter = ("is_pinned",)


@admin.register(MemberTask)
class MemberTaskAdmin(admin.ModelAdmin):
    list_display = ("member", "title", "assigned_to", "status", "priority", "due_date")
    list_filter = ("status", "priority")


@admin.register(MemberEvaluation)
class MemberEvaluationAdmin(admin.ModelAdmin):
    list_display = ("member", "period_start", "period_end", "score", "evaluator")


@admin.register(VacationRequest)
class VacationRequestAdmin(admin.ModelAdmin):
    list_display = ("member", "start_date", "end_date", "days", "status")
    list_filter = ("status",)


@admin.register(VacationTransaction)
class VacationTransactionAdmin(admin.ModelAdmin):
    list_display = ("member", "days", "kind", "created_at")
    list_filter = ("kind",)


@admin.register(DocumentExpiryAlert)
class DocumentExpiryAlertAdmin(admin.ModelAdmin):
    list_display = ("document", "expiry_date", "created_at")
