"""Support fixtures for test_history_user.py.

Defines a throwaway model + API view + urlconf so the test can drive a
real HTTP request through the *actual* middleware stack configured in
settings.MIDDLEWARE (RequestFactory-based hand-chaining of middleware is
brittle — it's easy to accidentally exercise an order that doesn't match
production). The model's table is created/dropped directly via the schema
editor in the test's setUpClass/tearDownClass since there's no migration
for it (and never should be — it exists only for this test).
"""

from django.db import models
from django.urls import path

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel


class HistoryProbe(BaseModel):
    label = models.CharField(max_length=50)
    history = HistoricalRecords()

    class Meta:
        app_label = "core"


class CreateProbeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        HistoryProbe.objects.create(label=request.data.get("label", "probe"))
        return Response(status=201)


urlpatterns = [
    path("__test_probe__/", CreateProbeView.as_view(), name="history-probe"),
]
