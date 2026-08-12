import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "change-me")
DEBUG = False
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "*").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "simple_history",
    "drf_spectacular",
    "django_filters",
    # Local apps
    "apps.core",
    "apps.organization",
    "apps.members",
    "apps.workflow",
    "apps.reports",
    "apps.equipment",
]

# See apps/reports/renderer.py — engine abstraction for the PDF pipeline.
REPORTS_PDF_ENGINE = os.environ.get("REPORTS_PDF_ENGINE", "weasyprint")

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    # Resolves request.user from a JWT for the plain Django HttpRequest.
    # Must sit after AuthenticationMiddleware (session auth wins if present)
    # and before HistoryRequestMiddleware (which reads request.user to
    # attribute history_user) — otherwise every simple_history row written
    # through the JWT-authenticated API gets history_user=NULL.
    "apps.core.middleware.JWTAuthenticationMiddleware",
    "simple_history.middleware.HistoryRequestMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Kept as the *formatting* locale (Latin-digit number/date formatting is
# the least surprising here); Arabic RTL is applied purely in the frontend
# templates/CSS, not via Django's `ar` locale (whose date format strings
# would need per-call `|unlocalize` handling to keep numerals Latin).
LANGUAGE_CODE = "en-us"

# The apparatus operates in Libya; UTC would put printed document expiry
# dates and audit-log timestamps 2h off from local wall-clock time.
TIME_ZONE = "Africa/Tripoli"

USE_I18N = True

USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

MEDIA_URL = "/media/"
MEDIA_ROOT = Path(os.environ.get("MEDIA_ROOT", BASE_DIR / "media"))

# Storage for uploaded documents (birth certificates, passports, national ID
# scans, photos) that must NEVER be reachable by guessing a URL. Deliberately
# outside MEDIA_ROOT/the web root — see apps.core.storage.PrivateMediaStorage.
# Defaults next to MEDIA_ROOT for local dev; set explicitly in production to
# a path outside the deployed webserver's document root.
PRIVATE_MEDIA_ROOT = Path(
    os.environ.get("PRIVATE_MEDIA_ROOT", BASE_DIR / "private_media")
)

# Encrypted DB backups (apps.core.management.commands.backup_db) — outside
# both MEDIA_ROOT and PRIVATE_MEDIA_ROOT so a compromised media path can't
# also reach every backup. See apps/core/backup_crypto.py for why
# BACKUP_ENCRYPTION_KEY isn't required to be an exact Fernet key.
BACKUP_ROOT = Path(os.environ.get("BACKUP_ROOT", BASE_DIR / "backups"))
BACKUP_ENCRYPTION_KEY = os.environ.get("BACKUP_ENCRYPTION_KEY") or SECRET_KEY

# Single-origin production deploy (see PLAN.md/deploy/README.md): the built
# frontend (`cd frontend && npm run build`) is served by Django/WhiteNoise
# instead of a separate static host, to kill CORS and simplify auth/print.
# WHITENOISE_ROOT serves frontend/dist's files (JS/CSS/fonts) directly at
# the URL root; config.urls's catch-all view returns dist/index.html for
# any other non-API path so React Router's client-side routes survive a
# hard refresh (e.g. GET /members/5). A no-op in dev, where the frontend
# runs on its own Vite dev server instead — see FRONTEND_DIST.exists()
# guard below and in config/urls.py.
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"
if not FRONTEND_DIST.exists():
    FRONTEND_DIST = BASE_DIR / "frontend_dist"
if FRONTEND_DIST.exists():
    WHITENOISE_ROOT = str(FRONTEND_DIST)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "core.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        # Login is otherwise an open brute-force target — TokenObtainPairView
        # has no throttle applied by default. See config/urls.py / core/urls.py
        # for where the "login" scope is attached.
        "login": "10/min",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "National Support Force Apparatus API",
    "DESCRIPTION": "API for the National Support Force Apparatus project",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}