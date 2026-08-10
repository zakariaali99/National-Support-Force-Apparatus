from decimal import Decimal

from django.core.validators import RegexValidator
from django.db import models
from django.db.models import Q

from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel
from apps.core.storage import PrivateMediaStorage, private_upload_path
from apps.members.utils.arabic import normalize_ar

BLOOD_TYPE_CHOICES = [
    ("A+", "A+"),
    ("A-", "A-"),
    ("B+", "B+"),
    ("B-", "B-"),
    ("AB+", "AB+"),
    ("AB-", "AB-"),
    ("O+", "O+"),
    ("O-", "O-"),
]

# Two separate lifecycles, deliberately not collapsed into one `status`
# field: approval is a one-time workflow gate (Phase 6), service_status is
# an ongoing employment state. Collapsing them would destroy a retiring
# member's approval history and make "approved members who are retired"
# unqueryable.
APPROVAL_STATUS_CHOICES = [
    ("draft", "مسودة"),
    ("pending", "بانتظار الاعتماد"),
    ("approved", "معتمد"),
    ("rejected", "مرفوض"),
]

SERVICE_STATUS_CHOICES = [
    ("active", "نشط"),
    ("suspended", "موقوف"),
    ("on_leave", "في إجازة"),
    ("retired", "متقاعد"),
    ("deceased", "متوفى"),
]

# Enforced primarily by the serializer (which also normalizes Arabic-Indic
# digits before validating — see serializers/member.py). Kept here too as
# defense-in-depth for the Django admin's plain ModelForm path.
national_number_validator = RegexValidator(
    r"^[0-9]{12}$", "الرقم الوطني يجب أن يتكون من 12 رقماً."
)


class Member(BaseModel):
    private_upload_folder = "member-photos"

    # الاسم الأول / اسم الأب / اسم الجد / اللقب — four separate fields,
    # not a combined name string; each is independently displayed/printed.
    first_name = models.CharField(max_length=100)
    second_name = models.CharField(max_length=100)
    third_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    # Maintained automatically in save() — never set this directly.
    search_name = models.CharField(max_length=420, db_index=True, editable=False, blank=True)

    photo = models.ImageField(
        upload_to=private_upload_path, storage=PrivateMediaStorage(), null=True, blank=True
    )
    photo_thumb = models.ImageField(
        upload_to=private_upload_path, storage=PrivateMediaStorage(), null=True, blank=True
    )

    force_number = models.CharField(max_length=50, db_index=True)  # الرقم الحربي
    national_number = models.CharField(
        max_length=12, db_index=True, validators=[national_number_validator]
    )
    date_of_birth = models.DateField(null=True, blank=True)
    place_of_birth = models.CharField(max_length=150, blank=True)
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPE_CHOICES, blank=True)

    rank = models.ForeignKey("organization.Rank", on_delete=models.PROTECT, related_name="members")
    faction = models.ForeignKey(
        "organization.Faction", on_delete=models.PROTECT, related_name="members"
    )

    phone = models.CharField(max_length=20, db_index=True, blank=True)
    pledges = models.TextField(blank=True)  # التعهدات
    join_date = models.DateField(null=True, blank=True)

    approval_status = models.CharField(
        max_length=20, choices=APPROVAL_STATUS_CHOICES, default="draft", db_index=True
    )
    service_status = models.CharField(
        max_length=20, choices=SERVICE_STATUS_CHOICES, default="active", db_index=True
    )

    # Denormalized cache, source of truth is the VacationTransaction ledger
    # added in Phase 4 — kept here now so the field exists on the profile
    # from day one without a later migration reshuffle.
    vacation_balance_days = models.DecimalField(max_digits=6, decimal_places=1, default=Decimal("0"))

    created_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    updated_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    history = HistoricalRecords(excluded_fields=["updated_at", "search_name"])

    class Meta:
        ordering = ["last_name", "first_name"]
        constraints = [
            # Not `unique=True` — a soft-deleted member's number must be
            # reusable, or a mistaken entry permanently burns that number.
            models.UniqueConstraint(
                fields=["force_number"],
                condition=Q(is_deleted=False),
                name="uniq_active_member_force_number",
            ),
            models.UniqueConstraint(
                fields=["national_number"],
                condition=Q(is_deleted=False),
                name="uniq_active_member_national_number",
            ),
        ]
        indexes = [
            models.Index(fields=["faction", "service_status"]),
        ]
        verbose_name = "Member"
        verbose_name_plural = "Members"

    @property
    def full_name(self):
        parts = [self.first_name, self.second_name, self.third_name, self.last_name]
        return " ".join(p for p in parts if p)

    def save(self, *args, **kwargs):
        self.search_name = normalize_ar(self.full_name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name
