from django.test import Client, TestCase


class SpaCatchAllTests(TestCase):
    """Sanity-checks the single-origin production routing added in Phase 8
    (see config/urls.py::SPAIndexView). Only meaningful when
    frontend/dist has been built — skips otherwise rather than failing a
    fresh checkout that hasn't run `npm run build` yet.
    """

    def setUp(self):
        from django.conf import settings

        if not (settings.FRONTEND_DIST / "index.html").exists():
            self.skipTest("frontend/dist not built — run `npm run build` in frontend/ to exercise this test")

    def test_client_route_falls_back_to_index_html(self):
        client = Client()

        response = client.get("/members/5")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"<div id=\"root\"", response.content)

    def test_root_falls_back_to_index_html(self):
        client = Client()

        response = client.get("/")

        self.assertEqual(response.status_code, 200)

    def test_api_paths_are_not_swallowed_by_the_catchall(self):
        client = Client()

        response = client.get("/api/auth/me/")

        self.assertEqual(response.status_code, 401)  # reaches the real view, not the SPA fallback
