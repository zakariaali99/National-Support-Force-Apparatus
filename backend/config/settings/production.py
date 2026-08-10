import os

from django.core.exceptions import ImproperlyConfigured

from .base import *

# Fail loudly rather than silently deploying with the dev placeholder
# secret or a wide-open host allowlist — both are easy to miss until
# they're a real incident.
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
if not SECRET_KEY or SECRET_KEY == "change-me":
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY must be set to a real secret in production."
    )

_allowed_hosts_raw = os.environ.get("ALLOWED_HOSTS", "")
ALLOWED_HOSTS = [h.strip() for h in _allowed_hosts_raw.split(",") if h.strip()]
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured(
        "ALLOWED_HOSTS must be set explicitly in production (comma-separated "
        "hostnames) — this system holds national ID and passport data and "
        "must not accept requests for arbitrary Host headers."
    )

DEBUG = os.environ.get("DJANGO_DEBUG", "False") == "True"

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "nsfa"),
        "USER": os.environ.get("POSTGRES_USER", "nsfa"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", ""),
        "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
}

# Files outside MEDIA_ROOT that must never be served by URL guessing
# (birth certificates, passports, national ID scans). See
# apps.core.storage.PrivateMediaStorage. Must be set to a path outside the
# deployed webserver's document root.
PRIVATE_MEDIA_ROOT = os.environ.get("PRIVATE_MEDIA_ROOT", PRIVATE_MEDIA_ROOT)

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = os.environ.get("DJANGO_SECURE_SSL_REDIRECT", "True") == "True"

# Cheap, standard hardening for a system holding national ID numbers,
# passport scans, and personnel photographs — no reason not to have these
# on by default in production.
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
}