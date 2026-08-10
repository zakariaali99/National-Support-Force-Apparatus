import uuid

from django.conf import settings
from django.core.files.storage import FileSystemStorage


class PrivateMediaStorage(FileSystemStorage):
    """Storage for files that must never be served by URL guessing.

    Backed by settings.PRIVATE_MEDIA_ROOT, a directory that sits outside
    MEDIA_ROOT/the web server's document root. Nothing maps a public URL to
    this location — files are only ever reachable through an authenticated
    Django view (see apps.members.views.document for the download endpoint
    added in Phase 2), which checks permissions and logs the access before
    streaming the bytes back.
    """

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("location", settings.PRIVATE_MEDIA_ROOT)
        kwargs.setdefault("base_url", None)
        super().__init__(*args, **kwargs)


def private_upload_path(instance, filename):
    """Build a non-guessable, PII-free storage path for an uploaded document.

    The original filename (which often carries a member's name, e.g.
    "passport_ahmed.pdf") is discarded from the path — callers should keep
    it separately (e.g. MemberDocument.original_name) for display only.
    Path is namespaced by upload date, which also keeps any one directory
    from growing unbounded.
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    name = f"{uuid.uuid4().hex}.{ext}" if ext else uuid.uuid4().hex
    from django.utils import timezone

    now = timezone.now()
    folder = getattr(instance, "private_upload_folder", "documents")
    return f"{folder}/{now:%Y}/{now:%m}/{name}"
