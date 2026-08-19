from rest_framework.permissions import BasePermission


def user_can_access_faction(user, faction_id):
    """Single-object counterpart to ScopedQuerysetMixin, for plain views
    (e.g. the document download endpoint) that fetch one instance by pk
    rather than filtering a queryset.
    """
    if user.is_superuser:
        return True
    if "all" in set(user.roles.values_list("scope", flat=True)):
        return True
    return user.factions.filter(id=faction_id).exists()


def scope_queryset_to_user_factions(user, queryset, faction_lookup="faction"):
    """Queryset counterpart of user_can_access_faction — shared by
    ScopedQuerysetMixin (for viewsets) and any plain APIView that needs the
    same faction-scoping rule over a multi-row queryset (e.g. the reports
    app's batch ID-card / Excel export endpoints).
    """
    if not user or not user.is_authenticated:
        return queryset.none()
    if user.is_superuser:
        return queryset

    scopes = set(user.roles.values_list("scope", flat=True))
    if "all" in scopes:
        return queryset

    faction_ids = list(user.factions.values_list("id", flat=True))
    if not faction_ids:
        return queryset.none()
    return queryset.filter(**{f"{faction_lookup}__in": faction_ids})


class HasPermission(BasePermission):
    """DRF permission class checking one permission codename via the Role
    engine (apps.core.models.role.Role / apps.core.permissions.registry).

    A view opts in one of two ways:

    - `required_permission = "member.view"` — same codename for every
      action on the view.
    - `permission_map = {"list": None, "retrieve": None,
      "create": "organization.manage", "destroy": "organization.manage"}`
      — per-action codenames for a ViewSet. A codename of `None` means
      "any authenticated user, no specific permission required" (typical
      for read actions on shared lookup data like ranks/factions). An
      action missing from the map denies by default.

    A view that sets neither `required_permission` nor `permission_map`
    denies everything — an endpoint must opt in explicitly rather than
    silently defaulting open.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Superusers always pass all permission checks unconditionally
        if request.user.is_superuser:
            return True

        permission_map = getattr(view, "permission_map", None)
        if permission_map is not None:
            action = getattr(view, "action", None)
            if not action and hasattr(request, "method"):
                action = request.method.lower()
            if action not in permission_map:
                return False
            codename = permission_map[action]
            if codename is None:
                return True
            if isinstance(codename, (list, tuple, set)):
                return any(request.user.has_permission(c) for c in codename)
            return request.user.has_permission(codename)

        codename = getattr(view, "required_permission", None)
        if codename is None:
            return False
        if isinstance(codename, (list, tuple, set)):
            return any(request.user.has_permission(c) for c in codename)
        return request.user.has_permission(codename)


class ScopedQuerysetMixin:
    """Restricts a ViewSet's queryset to the requesting user's factions.

    A supervisor of faction A should not be able to read faction B's
    member records (and, downstream, their passports/national ID scans).
    Mix into any viewset whose model has — or is related to — a `faction`
    FK; set `faction_lookup` to the ORM path when it's not directly
    `faction` (e.g. "member__faction" for a MemberDocument viewset).

    A user with ANY "all"-scoped role (e.g. admin) sees everything. A user
    with only "own_faction"/"own_records"-scoped roles is restricted to
    their assigned factions (User.factions); a user with no factions
    assigned and no "all"-scoped role sees nothing, rather than everything
    by accident of an empty filter.
    """

    faction_lookup = "faction"

    def get_queryset(self):
        qs = super().get_queryset()
        return scope_queryset_to_user_factions(self.request.user, qs, self.faction_lookup)
