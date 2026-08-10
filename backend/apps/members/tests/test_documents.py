import io

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from PIL import Image
from rest_framework.test import APIClient

from apps.core.models import Role, User
from apps.members.models import Member, MemberDocument
from apps.organization.models import DocumentType, Faction, Rank


def _real_png_bytes():
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), color="white").save(buf, format="PNG")
    return buf.getvalue()


class DocumentUploadTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        role = Role.objects.create(
            name="doc-uploader",
            name_ar="رافع مستندات",
            permissions=["document.upload", "document.view"],
            scope="all",
        )
        self.user = User.objects.create_user(username="uploader", password="x")
        self.user.roles.add(role)
        self.client.force_authenticate(self.user)

        rank = Rank.objects.create(code="doc-rank", name_ar="رتبة")
        faction = Faction.objects.create(code="doc-faction", name_ar="فصيل")
        self.member = Member.objects.create(
            first_name="نبيل",
            second_name="فرج",
            last_name="القذافي",
            force_number="D-1",
            national_number="423456789012",
            rank=rank,
            faction=faction,
        )
        self.doc_type = DocumentType.objects.get(code="passport")

    def test_upload_rejects_file_with_spoofed_extension(self):
        fake_pdf = SimpleUploadedFile(
            "passport.pdf", b"<html><script>alert(1)</script></html>", content_type="application/pdf"
        )

        response = self.client.post(
            "/api/member-documents/",
            {"member": self.member.id, "document_type": self.doc_type.id, "file": fake_pdf},
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(MemberDocument.objects.filter(member=self.member).exists())

    def test_upload_accepts_real_png_and_sniffs_content_type(self):
        real_png = SimpleUploadedFile("scan.png", _real_png_bytes(), content_type="application/pdf")

        response = self.client.post(
            "/api/member-documents/",
            {"member": self.member.id, "document_type": self.doc_type.id, "file": real_png},
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        doc = MemberDocument.objects.get(member=self.member)
        self.assertEqual(doc.content_type, "image/png")
        self.assertTrue(doc.sha256)

    def test_download_requires_document_view_permission(self):
        real_png = SimpleUploadedFile("scan.png", _real_png_bytes(), content_type="image/png")
        self.client.post(
            "/api/member-documents/",
            {"member": self.member.id, "document_type": self.doc_type.id, "file": real_png},
            format="multipart",
        )
        doc = MemberDocument.objects.get(member=self.member)

        no_perm_user = User.objects.create_user(username="no-perm", password="x")
        self.client.force_authenticate(no_perm_user)

        response = self.client.get(f"/api/documents/{doc.id}/download/")

        self.assertEqual(response.status_code, 403)

    def test_download_works_for_authorized_user(self):
        real_png = SimpleUploadedFile("scan.png", _real_png_bytes(), content_type="image/png")
        self.client.post(
            "/api/member-documents/",
            {"member": self.member.id, "document_type": self.doc_type.id, "file": real_png},
            format="multipart",
        )
        doc = MemberDocument.objects.get(member=self.member)

        response = self.client.get(f"/api/documents/{doc.id}/download/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "image/png")
