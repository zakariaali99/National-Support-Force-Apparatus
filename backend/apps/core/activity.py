from apps.core.models import ActivityLog


def _client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_activity(*, actor=None, action, target_model="", target_id="", description="", metadata=None, request=None):
    """Single entry point for writing an ActivityLog row — see that
    model's docstring for what belongs here vs. HistoricalRecords.
    `actor=None` is valid (e.g. login_failed, where there's no
    authenticated user yet).
    """
    ip_address = None
    user_agent = ""
    if request is not None:
        ip_address = _client_ip(request)
        user_agent = request.META.get("HTTP_USER_AGENT", "")[:255]

    return ActivityLog.objects.create(
        actor=actor,
        actor_username=getattr(actor, "username", "") or "",
        action=action,
        target_model=target_model,
        target_id=str(target_id) if target_id else "",
        description=description,
        metadata=metadata or {},
        ip_address=ip_address,
        user_agent=user_agent,
    )
