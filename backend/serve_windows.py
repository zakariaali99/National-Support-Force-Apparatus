"""
Windows Production Server Entrypoint using Waitress & WSGI.
Designed specifically to run as a Windows Service under NSSM (Non-Sucking Service Manager).

This script:
 1. Configures Django environment settings.
 2. Runs database migrations automatically on boot.
 3. Collects static files for WhiteNoise.
 4. Serves both Backend API (/api/) and Frontend SPA (/dist/) via Waitress on port 8000.
"""

import os
import sys
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("NSFA-Windows-Server")

# Set Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.windows")

import django
django.setup()

from django.core.management import call_command
from django.core.wsgi import get_wsgi_application
from django.conf import settings
from waitress import serve

# Run automatic database migrations
try:
    logger.info("Running automatic database migrations...")
    call_command("migrate", interactive=False)
    logger.info("Database migrations completed successfully.")
except Exception as e:
    logger.error(f"Migration error: {e}")

# Run collectstatic
try:
    logger.info("Collecting static files...")
    call_command("collectstatic", interactive=False, verbosity=0)
    logger.info("Static files collected successfully.")
except Exception as e:
    logger.warning(f"Collectstatic warning: {e}")

# Load WSGI Application
django_app = get_wsgi_application()

FRONTEND_DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if not FRONTEND_DIST_DIR.exists():
    FRONTEND_DIST_DIR = Path(__file__).resolve().parent / "frontend_dist"

class SinglePortApp:
    """WSGI Middleware that routes /api/ requests to Django,
    and all static/SPA routes to frontend/dist/index.html.
    """
    def __init__(self, django_app, dist_dir):
        self.django_app = django_app
        self.dist_dir = dist_dir
        self.index_file = dist_dir / "index.html"

    def __call__(self, environ, start_response):
        path = environ.get("PATH_INFO", "")

        # Pass API and Admin requests directly to Django WSGI
        if path.startswith("/api/") or path.startswith("/admin/") or path.startswith("/static/") or path.startswith("/media/"):
            return self.django_app(environ, start_response)

        # Check if requested path is an existing static file in frontend/dist
        requested_file = (self.dist_dir / path.lstrip("/")).resolve()
        if path != "/" and requested_file.is_file() and str(requested_file).startswith(str(self.dist_dir)):
            return self.serve_file(requested_file, start_response)

        # Fallback to SPA index.html for frontend client-side routes (/members, /inventory, /settings, etc.)
        if self.index_file.is_file():
            return self.serve_file(self.index_file, start_response)

        return self.django_app(environ, start_response)

    def serve_file(self, file_path, start_response):
        content_type = "text/html"
        suffix = file_path.suffix.lower()
        if suffix == ".js":
            content_type = "application/javascript"
        elif suffix == ".css":
            content_type = "text/css"
        elif suffix == ".png":
            content_type = "image/png"
        elif suffix == ".jpg" or suffix == ".jpeg":
            content_type = "image/jpeg"
        elif suffix == ".svg":
            content_type = "image/svg+xml"
        elif suffix == ".woff2":
            content_type = "font/woff2"

        with open(file_path, "rb") as f:
            content = f.read()

        start_response("200 OK", [
            ("Content-Type", content_type),
            ("Content-Length", str(len(content))),
            ("Cache-Control", "no-cache" if suffix == ".html" else "public, max-age=31536000"),
        ])
        return [content]

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))

    app = SinglePortApp(django_app, FRONTEND_DIST_DIR)

    logger.info("=================================================================")
    logger.info(" الجهاز الوطني للقوى المساندة — منظومة التوثيق وإدارة شؤون الأفراد")
    logger.info(f" Starting Waitress Windows Server on http://{host}:{port}")
    logger.info(f" Access System Locally at: http://localhost:{port}")
    logger.info("=================================================================")

    serve(app, host=host, port=port, threads=8)
