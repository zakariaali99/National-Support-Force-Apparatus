from django.core.exceptions import ValidationError
from django.db import models

from apps.core.permissions.registry import ALL_CODENAMES


class Role(models.Model):
    """A named, editable bundle of permission codenames a user can hold.

    Deliberately NOT built on Django's contrib.auth Permission/Group model —
    see apps.core.permissions.registry for why. Not a BaseModel subclass
    either: roles aren't soft-deletable business records, they're
    configuration; `is_system` prevents the seeded presets from being
    deleted through the API (enforced in the viewset), which is enough.
    """

    SCOPE_CHOICES = [
        ("all", "الكل — جميع الفصائل"),
        ("own_faction", "فصيله فقط"),
        ("own_records", "السجلات التي أنشأها فقط"),
    ]

    name = models.SlugField(max_length=50, unique=True)
    name_ar = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    # List of permission codenames from apps.core.permissions.registry,
    # e.g. ["member.view", "member.edit"]. Validated against the registry
    # in clean()/save() so a typo'd codename fails loudly instead of
    # silently granting nothing.
    permissions = models.JSONField(default=list, blank=True)
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default="own_faction")
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name_ar"]
        verbose_name = "Role"
        verbose_name_plural = "Roles"

    def __str__(self):
        return self.name_ar

    def clean(self):
        super().clean()
        invalid = set(self.permissions or []) - ALL_CODENAMES
        if invalid:
            raise ValidationError(
                {"permissions": f"Unknown permission codename(s): {', '.join(sorted(invalid))}"}
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
