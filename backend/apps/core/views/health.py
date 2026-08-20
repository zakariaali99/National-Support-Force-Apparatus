from django.db import connection
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """System health check endpoint for monitoring, deployment verifications, and uptime."""

    permission_classes = [AllowAny]

    def get(self, request):
        db_ok = False
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                row = cursor.fetchone()
                db_ok = row is not None and row[0] == 1
        except Exception as exc:
            db_error = str(exc)
        else:
            db_error = None

        status_str = "healthy" if db_ok else "unhealthy"
        response_data = {
            "status": status_str,
            "timestamp": timezone.now().isoformat(),
            "database": {
                "connected": db_ok,
                "engine": connection.settings_dict.get("ENGINE", "").split(".")[-1],
                "error": db_error,
            },
            "system": "الجهاز الوطني للقوى المساندة - منظومة الإدارة والمتابعة الموحدة",
            "version": "2.0.0",
        }
        return Response(response_data, status=200 if db_ok else 503)
