"""Regression test for the JWT + django-simple-history history_user bug.

simple_history.middleware.HistoryRequestMiddleware resolves `history_user`
from `request.user` on the plain Django HttpRequest. DRF's JWTAuthentication
only ever populates the *DRF* request's `.user` (inside the view), so
without apps.core.middleware.JWTAuthenticationMiddleware bridging the two,
every write made through the JWT-authenticated API silently records
history_user=NULL — the entire audit-trail requirement depends on this
being fixed and staying fixed.

Drives a real request through the actual configured middleware chain (via
the Django test Client + a temporary urlconf) rather than hand-chaining
middleware, so this also catches any future MIDDLEWARE reordering that
breaks the fix.
"""

from django.db import connection
from django.test import TestCase, override_settings

from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.models import User
from apps.core.tests._history_probe import HistoryProbe


@override_settings(ROOT_URLCONF="apps.core.tests._history_probe")
class HistoryUserAttributionTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        with connection.schema_editor() as editor:
            editor.create_model(HistoryProbe)
            editor.create_model(HistoryProbe.history.model)

    @classmethod
    def tearDownClass(cls):
        with connection.schema_editor() as editor:
            editor.delete_model(HistoryProbe.history.model)
            editor.delete_model(HistoryProbe)
        super().tearDownClass()

    def setUp(self):
        self.caller = User.objects.create_user(username="caller", password="x")

    def test_history_user_is_the_jwt_caller_on_api_write(self):
        token = str(RefreshToken.for_user(self.caller).access_token)

        response = self.client.post(
            "/__test_probe__/",
            data={"label": "created via API"},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 201)
        record = HistoryProbe.history.first()
        self.assertIsNotNone(record.history_user)
        self.assertEqual(record.history_user_id, self.caller.id)

    def test_unauthenticated_write_is_rejected_not_silently_null(self):
        response = self.client.post("/__test_probe__/", data={"label": "nope"})

        # IsAuthenticated is the DRF default permission — no token means no
        # write happens at all, so there's nothing to mis-attribute.
        self.assertEqual(response.status_code, 401)
        self.assertFalse(HistoryProbe.history.exists())
