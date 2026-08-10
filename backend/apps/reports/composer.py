"""Two-stage print pipeline (see PLAN.md's "Printing / PDF pipeline"):

1. Each selected item (an HTML section, or a scanned document) becomes its
   own standalone PDF's bytes.
2. `compose()` concatenates them with pypdf, in the caller's chosen order —
   this is what structurally guarantees "each item on its own sheet"
   instead of relying on CSS break-after inside one big document.
"""

import io

from django.template.loader import render_to_string

from apps.reports.renderer import render_html_to_pdf

IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png"}


def document_to_pdf_bytes(document):
    """A scanned document's own PDF page. A document whose source file is
    already a PDF is used as-is (never re-rendered/re-rasterized — that
    would lose quality and defeats the point of accepting PDF uploads). An
    image document is wrapped in a one-page HTML template with a header so
    it prints consistently with the rest of the profile.
    """
    if document.content_type == "application/pdf":
        with document.file.open("rb") as fh:
            return fh.read()

    if document.content_type in IMAGE_CONTENT_TYPES:
        image_uri = document.file.storage.path(document.file.name)
        import pathlib

        html_string = render_to_string(
            "print/document_image.html",
            {
                "document": document,
                "image_uri": pathlib.Path(image_uri).resolve().as_uri(),
            },
        )
        return render_html_to_pdf(html_string)

    raise ValueError(f"Cannot render document content type {document.content_type} to PDF")


def compose(pdf_byte_chunks):
    """Concatenates a list of single-or-multi-page PDF byte blobs into one
    PDF, preserving order. Returns bytes.
    """
    from pypdf import PdfWriter

    writer = PdfWriter()
    for chunk in pdf_byte_chunks:
        writer.append(io.BytesIO(chunk))

    buffer = io.BytesIO()
    writer.write(buffer)
    return buffer.getvalue()
