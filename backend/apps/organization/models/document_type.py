from django.db import models

from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel


class DocumentType(BaseModel):
    """A kind of document a member profile can hold (birth certificate,
    passport, national ID paper, ...). Table-driven rather than a hardcoded
    enum so adding a new document type ("driving licence", "medical card")
    is a Settings action, not a migration + redeploy — and it's what makes
    the print-selection popup / "select all" and the member-document upload
    UI generic instead of hardcoded per type.
    """

    code = models.SlugField(max_length=50, unique=True)
    name_ar = models.CharField(max_length=100)
    requires_expiry = models.BooleanField(default=False)
    expiry_warn_days = models.PositiveIntegerField(default=60)
    # Allow more than one file under this type per member (e.g. multiple
    # scanned pages). Birth certificate/passport/national ID default False.
    allow_multiple = models.BooleanField(default=False)
    is_printable = models.BooleanField(default=True)
    print_order = models.PositiveIntegerField(default=0)
    # System-seeded types (birth_certificate, passport, national_id_paper)
    # cannot be deleted or have their `code` changed from Settings — the
    # Member model's national_number/search logic and the print pipeline
    # assume these codes exist.
    is_system = models.BooleanField(default=False)

    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["print_order", "name_ar"]
        verbose_name = "Document Type"
        verbose_name_plural = "Document Types"

    def __str__(self):
        return self.name_ar
