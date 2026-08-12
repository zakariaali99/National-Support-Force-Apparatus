import dj_database_url

from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]

CORS_ALLOW_ALL_ORIGINS = True

# Postgres in dev too — not for purity, but because several things this
# system needs (select_for_update() row locking for the vacation ledger,
# partial/conditional unique constraints, case-folding on Arabic text) are
# either no-ops or behave differently on SQLite. Tuning a query against
# SQLite and shipping it against Postgres is how you find out in production.
# DATABASE_URL overrides this for anyone whose local Postgres is configured
# differently (see .env.example).
DATABASES = {
    "default": dj_database_url.config(
        env="DATABASE_URL",
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
    )
}