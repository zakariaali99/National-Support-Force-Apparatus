from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path, re_path
from django.views import View

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/", include("apps.core.urls")),
    path("api/", include("apps.organization.urls")),
    # Must precede apps.members.urls: /members/id-cards/ and /members/export/
    # would otherwise be swallowed by MemberViewSet's /members/<pk>/ route
    # (the router's default lookup regex matches any non-slash segment).
    path("api/", include("apps.reports.urls")),
    path("api/", include("apps.members.urls")),
    path("api/", include("apps.workflow.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


class SPAIndexView(View):
    """Serves the built frontend's index.html for any path this urlconf
    hasn't already matched, so React Router's client-side routes (e.g.
    /members/5) survive a hard refresh in the single-origin production
    deploy (see FRONTEND_DIST in settings/base.py). The actual JS/CSS/font
    files are served by WhiteNoise (WHITENOISE_ROOT), not this view — this
    only ever returns the one HTML shell. In dev (frontend/dist doesn't
    exist — the frontend runs on its own Vite server instead), this is
    simply never reached because nothing proxies to Django for non-/api
    paths.
    """

    def get(self, request, *args, **kwargs):
        index_path = settings.FRONTEND_DIST / "index.html"
        if not index_path.exists():
            return HttpResponse(
                "Frontend build not found — run `npm run build` in frontend/ "
                "and redeploy. See deploy/README.md.",
                status=501,
            )
        return HttpResponse(index_path.read_text(encoding="utf-8"))


# Must stay LAST: matches any path not already claimed above (API, admin,
# schema, media-in-DEBUG). Static asset paths never reach this — WhiteNoise
# intercepts them at the middleware level before URL resolution runs.
urlpatterns += [re_path(r"^(?!api/|admin/).*$", SPAIndexView.as_view(), name="spa-index")]
