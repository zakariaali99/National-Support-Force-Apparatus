from django.db import models

from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel
from apps.core.storage import PrivateMediaStorage, private_upload_path


class MemberDocument(BaseModel):
    """A scanned document attached to a member's profile (birth certificate,
    passport, national ID paper, or any custom type added in Settings — see
    apps.organization.models.DocumentType). Generic by document_type rather
    than one field per document: this is what makes the print-selection
    popup and "select all" (Phase 5) work without a hardcoded branch per
    document, and lets new document types be added without a migration.
    """

    private_upload_folder = "member-documents"

    member = models.ForeignKey("members.Member", on_delete=models.CASCADE, related_name="documents")
    document_type = models.ForeignKey(
        "organization.DocumentType", on_delete=models.PROTECT, related_name="+"
    )
    title = models.CharField(max_length=150, blank=True)
    file = models.FileField(upload_to=private_upload_path, storage=PrivateMediaStorage())
    # Original filename is display-only, NEVER used as the storage path —
    # it often carries PII (e.g. "passport_ahmed_altrhouni.pdf") and would
    # enable path traversal / filename guessing if used directly.
    original_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)  # sniffed server-side, not trusted from the client
    file_size = models.PositiveIntegerField()
    sha256 = models.CharField(max_length=64, db_index=True)
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True, db_index=True)
    is_current = models.BooleanField(default=True)
    uploaded_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["document_type__print_order", "-created_at"]
        verbose_name = "Member Document"
        verbose_name_plural = "Member Documents"

    def __str__(self):
        return f"{self.member} — {self.document_type}"
