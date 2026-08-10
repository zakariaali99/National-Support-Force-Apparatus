import hashlib
import io

from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile

from PIL import Image, ImageOps

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB
PDF_MAGIC = b"%PDF-"
IMAGE_SNIFF_FORMATS = {"JPEG", "PNG"}


def validate_upload_size(django_file):
    if django_file.size > MAX_UPLOAD_SIZE:
        raise ValidationError("حجم الملف يتجاوز الحد المسموح (10 ميجابايت).")


def sniff_content_type(django_file):
    """Determine the real content type by inspecting file bytes — never
    trust the client-supplied Content-Type or filename extension. A file
    uploaded as "passport.pdf" that's actually HTML would be a stored-XSS
    risk if ever served with its claimed type.

    Returns (content_type, extension); raises ValidationError if the file
    isn't a recognized PDF/JPEG/PNG.
    """
    django_file.seek(0)
    header = django_file.read(8)
    django_file.seek(0)

    if header.startswith(PDF_MAGIC):
        return "application/pdf", "pdf"

    try:
        with Image.open(django_file) as probe:
            probe.verify()
        django_file.seek(0)
        with Image.open(django_file) as probe:
            fmt = probe.format
    except Exception as exc:
        raise ValidationError("نوع الملف غير مدعوم أو الملف تالف. المسموح: PDF أو JPEG أو PNG.") from exc
    finally:
        django_file.seek(0)

    if fmt not in IMAGE_SNIFF_FORMATS:
        raise ValidationError("نوع الملف غير مدعوم. المسموح: PDF أو JPEG أو PNG.")
    return (f"image/{fmt.lower()}", "jpg" if fmt == "JPEG" else "png")


def compute_sha256(django_file):
    django_file.seek(0)
    hasher = hashlib.sha256()
    for chunk in django_file.chunks():
        hasher.update(chunk)
    django_file.seek(0)
    return hasher.hexdigest()


def process_photo(django_file, max_size=1200, thumb_size=200):
    """Strip EXIF and downscale an uploaded member photo.

    A geotagged photo of a security-force member is an operational risk,
    not a nice-to-have to avoid — this always re-encodes to a fresh JPEG
    with no metadata, applying the EXIF orientation first so the visible
    rotation is preserved even though the tag itself is dropped.

    Returns (main_content_file, thumb_content_file) as Django ContentFiles.
    """
    django_file.seek(0)
    image = Image.open(django_file)
    image = ImageOps.exif_transpose(image)
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")

    main_image = image.copy()
    main_image.thumbnail((max_size, max_size))
    main_buffer = io.BytesIO()
    main_image.save(main_buffer, format="JPEG", quality=82)
    main_file = ContentFile(main_buffer.getvalue())

    thumb_image = image.copy()
    thumb_image.thumbnail((thumb_size, thumb_size))
    thumb_buffer = io.BytesIO()
    thumb_image.save(thumb_buffer, format="JPEG", quality=80)
    thumb_file = ContentFile(thumb_buffer.getvalue())

    return main_file, thumb_file
