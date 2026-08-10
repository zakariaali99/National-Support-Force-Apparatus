from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # DEPRECATED: superseded by the Role/permission engine introduced in
    # Phase 1 (apps.core.models.role.Role, User.roles). Kept, non-editable,
    # for one release as a rollback-safe bridge — do not add new code paths
    # that branch on this field. Scheduled for removal once Role adoption
    # is confirmed in production.
    USER_TYPE_CHOICES = [
        ("admin", "Admin"),
        ("member", "Member"),
        ("supervisor", "Supervisor"),
    ]

    # null=True (not just blank=True) so multiple users can have no phone
    # on file without colliding on the unique constraint — Django/Postgres/
    # SQLite all treat NULL as distinct from NULL for uniqueness purposes,
    # but a shared "" would only allow a single phone-less user.
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    user_type = models.CharField(
        max_length=20, choices=USER_TYPE_CHOICES, default="member", editable=False
    )
    is_verified = models.BooleanField(default=False)

    # The roles/permission engine (apps.core.models.role.Role). A user can
    # hold more than one role (e.g. a supervisor who also does data entry).
    roles = models.ManyToManyField("core.Role", related_name="users", blank=True)
    # Which factions this user may act on, for roles scoped to
    # "own_faction" (see Role.scope / apps.core.permissions.classes.
    # ScopedQuerysetMixin). Irrelevant for "all"-scoped roles like admin.
    factions = models.ManyToManyField(
        "organization.Faction", related_name="users", blank=True
    )

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def save(self, *args, **kwargs):
        # Normalize a blank phone to NULL so it never collides with another
        # blank phone under the unique constraint.
        if self.phone == "":
            self.phone = None
        super().save(*args, **kwargs)

    def has_permission(self, codename):
        """Whether this user holds the given permission codename through
        any of their roles. Superusers always pass (Django admin escape
        hatch); inactive users never do.
        """
        if not self.is_active:
            return False
        if self.is_superuser:
            return True
        return any(codename in (role.permissions or []) for role in self.roles.all())

    def __str__(self):
        return self.username