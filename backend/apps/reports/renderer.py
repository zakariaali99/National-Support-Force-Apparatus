"""PDF rendering backend with automatic ReportLab fallback if WeasyPrint C-libraries are unavailable."""

import io
import os
import re
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone

FONT_DIR = settings.BASE_DIR / "static" / "fonts"

_ARABIC_FONT_REGISTERED = False
_ARABIC_FONT_NAME = "Helvetica"


def _ensure_arabic_font():
    global _ARABIC_FONT_REGISTERED, _ARABIC_FONT_NAME
    if _ARABIC_FONT_REGISTERED:
        return _ARABIC_FONT_NAME

    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    candidate_fonts = [
        "/System/Library/Fonts/SFArabic.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ]

    for p in candidate_fonts:
        if os.path.exists(p):
            try:
                pdfmetrics.registerFont(TTFont("NASF_Arabic", p))
                _ARABIC_FONT_NAME = "NASF_Arabic"
                _ARABIC_FONT_REGISTERED = True
                return _ARABIC_FONT_NAME
            except Exception:
                pass

    _ARABIC_FONT_REGISTERED = True
    return _ARABIC_FONT_NAME


def _font_face_css():
    def uri(name):
        return (FONT_DIR / name).resolve().as_uri()

    return f"""
    @font-face {{
        font-family: 'Cairo';
        src: url('{uri("Cairo-arabic-variable.woff2")}') format('woff2');
        font-weight: 200 1000;
    }}
    @font-face {{
        font-family: 'Cairo';
        src: url('{uri("Cairo-latin-variable.woff2")}') format('woff2');
        font-weight: 200 1000;
        unicode-range: U+0000-00FF;
    }}
    """


def _rtl(text):
    """Reshapes and reverses Arabic text for standard PDF canvases."""
    if not text:
        return ""
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display

        reshaped = arabic_reshaper.reshape(str(text))
        return get_display(reshaped)
    except Exception:
        return str(text)


def _render_fallback_pdf(html_string):
    """Generates an official vector PDF with full Arabic support and government branding."""
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    font_name = _ensure_arabic_font()
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)

    page_width, page_height = A4
    margin_x = 40
    content_width = page_width - (margin_x * 2)

    # Split by card or page-break if present
    cards = re.split(r'<div class=["\']card["\']>', html_string)
    if len(cards) > 1:
        card_items = cards[1:]
    else:
        card_items = [html_string]

    seal_path = os.path.join(settings.BASE_DIR, "static", "nasf-seal.jpg")

    for item_html in card_items:
        # Draw Header
        # Title Right
        c.setFont(font_name, 14)
        c.drawRightString(page_width - margin_x, page_height - 45, _rtl("دولة ليبيا"))
        c.setFont(font_name, 11)
        c.drawRightString(page_width - margin_x, page_height - 62, _rtl("الجهاز الوطني للقوى المساندة / الوحدة القتالية الرابعة"))
        c.setFont(font_name, 10)
        c.drawRightString(page_width - margin_x, page_height - 78, _rtl("منظومة الإدارة والمتابعة الإلكترونية الموحدة"))

        # Seal Image Left
        if os.path.exists(seal_path):
            try:
                c.drawImage(seal_path, margin_x, page_height - 85, width=45, height=45, preserveAspectRatio=True, mask="auto")
            except Exception:
                pass

        # Top line divider
        c.setLineWidth(1.5)
        c.setStrokeColorRGB(0.04, 0.14, 0.25)
        c.line(margin_x, page_height - 95, page_width - margin_x, page_height - 95)

        # Extract text content
        text_content = re.sub(r"<style[\s\S]*?</style>", "", item_html)
        text_content = re.sub(r"<script[\s\S]*?</script>", "", text_content)
        
        # Replace block tags with newline
        text_content = re.sub(r"</?(h1|h2|h3|tr|div|p|li)[^>]*>", "\n", text_content)
        text_content = re.sub(r"<[^>]+>", " ", text_content)
        
        raw_lines = [line.strip() for line in text_content.splitlines() if line.strip()]

        y = page_height - 118
        c.setFont(font_name, 9.5)

        for line in raw_lines:
            # Skip title repeats
            if any(skip in line for skip in ("دولة ليبيا", "الجهاز الوطني للقوى المساندة")):
                continue
            
            # Format lines nicely
            words = line.split()
            current_line = []
            for word in words:
                current_line.append(word)
                if len(" ".join(current_line)) > 55:
                    line_str = " ".join(current_line)
                    c.setFont(font_name, 9.5)
                    c.setFillColorRGB(0.06, 0.09, 0.16)
                    c.drawRightString(page_width - margin_x, y, _rtl(line_str))
                    # Also embed searchable numbers/ASCII words for PDF text extractors
                    ascii_tokens = re.findall(r'[0-9A-Za-z\-_]+', line_str)
                    for tok in ascii_tokens:
                        if len(tok) >= 2:
                            c.setFont("Helvetica", 0.01)
                            c.drawString(page_width - margin_x, y, tok)
                    y -= 15
                    current_line = []
                    if y < 65:
                        # Bottom Footer before new page
                        c.setLineWidth(0.5)
                        c.setStrokeColorRGB(0.8, 0.83, 0.88)
                        c.line(margin_x, 50, page_width - margin_x, 50)
                        c.setFont(font_name, 7.5)
                        c.setFillColorRGB(0.4, 0.45, 0.55)
                        now_str = timezone.now().strftime("%Y-%m-%d %H:%M")
                        c.drawString(margin_x, 38, _rtl(f"تاريخ الطباعة: {now_str}"))
                        c.drawRightString(page_width - margin_x, 38, _rtl("الجهاز الوطني للقوى المساندة"))
                        c.showPage()
                        y = page_height - 60
                        c.setFont(font_name, 9.5)
                        c.setFillColorRGB(0, 0, 0)
            
            if current_line:
                line_str = " ".join(current_line)
                c.setFont(font_name, 9.5)
                c.setFillColorRGB(0.06, 0.09, 0.16)
                c.drawRightString(page_width - margin_x, y, _rtl(line_str))
                # Also embed searchable numbers/ASCII words for PDF text extractors
                ascii_tokens = re.findall(r'[0-9A-Za-z\-_]+', line_str)
                for tok in ascii_tokens:
                    if len(tok) >= 2:
                        c.setFont("Helvetica", 0.01)
                        c.drawString(page_width - margin_x, y, tok)
                y -= 16
                if y < 65:
                    c.setLineWidth(0.5)
                    c.setStrokeColorRGB(0.8, 0.83, 0.88)
                    c.line(margin_x, 50, page_width - margin_x, 50)
                    c.setFont(font_name, 7.5)
                    c.setFillColorRGB(0.4, 0.45, 0.55)
                    now_str = timezone.now().strftime("%Y-%m-%d %H:%M")
                    c.drawString(margin_x, 38, _rtl(f"تاريخ الطباعة: {now_str}"))
                    c.drawRightString(page_width - margin_x, 38, _rtl("الجهاز الوطني للقوى المساندة"))
                    c.showPage()
                    y = page_height - 60
                    c.setFont(font_name, 9.5)
                    c.setFillColorRGB(0, 0, 0)

        # Draw Bottom Footer on the page
        c.setLineWidth(0.5)
        c.setStrokeColorRGB(0.8, 0.83, 0.88)
        c.line(margin_x, 50, page_width - margin_x, 50)
        c.setFont(font_name, 7.5)
        c.setFillColorRGB(0.4, 0.45, 0.55)
        now_str = timezone.now().strftime("%Y-%m-%d %H:%M")
        c.drawString(margin_x, 38, _rtl(f"تاريخ وتوقيت الإصدار: {now_str}"))
        c.drawRightString(page_width - margin_x, 38, _rtl("الجهاز الوطني للقوى المساندة - منظومة الإدارة الإلكترونية"))
        c.showPage()

    c.save()
    return buf.getvalue()


def render_html_to_pdf(html_string):
    """Renders one HTML document to standalone PDF bytes."""
    engine = getattr(settings, "REPORTS_PDF_ENGINE", "weasyprint")
    if engine != "weasyprint":
        raise NotImplementedError(f"Unsupported REPORTS_PDF_ENGINE: {engine}")

    try:
        from weasyprint import CSS, HTML

        base_url = settings.BASE_DIR.resolve().as_uri() + "/"
        return HTML(string=html_string, base_url=base_url).write_pdf(
            stylesheets=[CSS(string=_font_face_css())]
        )
    except (ImportError, OSError):
        return _render_fallback_pdf(html_string)


def render_template_to_pdf(template_name, context=None):
    html_string = render_to_string(template_name, context or {})
    return render_html_to_pdf(html_string)
