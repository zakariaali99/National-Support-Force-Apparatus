import os
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env before any settings module reads os.environ — both
# development.py (DATABASE_URL) and production.py (SECRET_KEY,
# ALLOWED_HOSTS, ...) depend on this running first. Silent no-op if the
# file doesn't exist (e.g. a host injecting real env vars directly).
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

if os.environ.get("DJANGO_ENV", "development") == "production":
    from .production import *
else:
    from .development import *