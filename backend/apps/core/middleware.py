from django.utils.deprecation import MiddlewareMixin
from django.utils.functional import SimpleLazyObject

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


def _get_jwt_user(request):
    """Resolve the JWT-authenticated user for a plain Django HttpRequest.

    DRF's JWTAuthentication normally runs inside the view and only ever
    populates `rest_framework.request.Request.user` — never the underlying
    Django `HttpRequest.user`. Anything that reads `request.user` off the
    *Django* request (django-simple-history's HistoryRequestMiddleware in
    particular, but also any plain Django view) sees AnonymousUser even
    though the caller sent a valid Bearer token, silently breaking
    history_user attribution on every API write.
    """
    from django.contrib.auth.models import AnonymousUser

    header = request.META.get("HTTP_AUTHORIZATION", "")
    if not header.startswith("Bearer "):
        return AnonymousUser()

    try:
        validated_token = JWTAuthentication().get_validated_token(header.split(" ", 1)[1])
        return JWTAuthentication().get_user(validated_token)
    except (InvalidToken, TokenError):
        return AnonymousUser()


class JWTAuthenticationMiddleware(MiddlewareMixin):
    """Populate request.user from a JWT for non-DRF-authenticated code paths.

    Must be placed AFTER AuthenticationMiddleware (so a real session user
    isn't clobbered) and BEFORE simple_history's HistoryRequestMiddleware
    (so history_user resolves correctly) in settings.MIDDLEWARE.

    Session-authenticated requests (e.g. the Django admin) are left alone —
    this only fills in the gap for JWT-only API requests.
    """

    def process_request(self, request):
        if getattr(request, "user", None) and request.user.is_authenticated:
            return
        request.user = SimpleLazyObject(lambda: _get_jwt_user(request))
