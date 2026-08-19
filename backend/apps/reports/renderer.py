"""PDF rendering backend with automatic Playwright/WeasyPrint/ReportLab engine."""

import io
import logging
import os
import re
import subprocess
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone

logger = logging.getLogger(__name__)

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
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Tahoma.ttf",
        "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
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


def _render_playwright_pdf(html_string):
    """Renders HTML string to high-fidelity PDF via local Playwright Chromium instance."""
    frontend_dir = os.path.join(os.path.dirname(settings.BASE_DIR), "frontend")
    if not os.path.isdir(frontend_dir):
        frontend_dir = str(settings.BASE_DIR)

    node_script = """
const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  try {
    const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const html = fs.readFileSync(0, "utf-8");
    await page.setContent(html, { waitUntil: "networkidle", timeout: 15000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });
    await browser.close();
    process.stdout.write(pdf);
  } catch (err) {
    process.stderr.write(err.message || String(err));
    process.exit(1);
  }
})();
"""
    proc = subprocess.Popen(
        ["node", "-e", node_script],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=frontend_dir,
    )
    out, err = proc.communicate(input=html_string.encode("utf-8"))
    if proc.returncode == 0 and len(out) > 1000:
        return out
    raise RuntimeError(f"Playwright PDF generation failed: {err.decode('utf-8', errors='ignore')}")


def _render_fallback_pdf(html_string):
    """Generates an official vector PDF with full Arabic support and government branding."""
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    font_name = _ensure_arabic_font()
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)

    page_width, page_height = A4
    margin_x = 40

    cards = re.split(r'<div class=["\']card["\']>', html_string)
    card_items = cards[1:] if len(cards) > 1 else [html_string]

    seal_path = os.path.join(settings.BASE_DIR, "static", "nasf-seal.jpg")

    for item_html in card_items:
        c.setFont(font_name, 14)
        c.drawRightString(page_width - margin_x, page_height - 45, _rtl("دولة ليبيا"))
        c.setFont(font_name, 11)
        c.drawRightString(page_width - margin_x, page_height - 62, _rtl("الجهاز الوطني للقوى المساندة / الوحدة القتالية الرابعة"))
        c.setFont(font_name, 10)
        c.drawRightString(page_width - margin_x, page_height - 78, _rtl("منظومة الإدارة والمتابعة الإلكترونية الموحدة"))

        if os.path.exists(seal_path):
            try:
                c.drawImage(seal_path, margin_x, page_height - 85, width=45, height=45, preserveAspectRatio=True, mask="auto")
            except Exception:
                pass

        c.setLineWidth(1.5)
        c.setStrokeColorRGB(0.04, 0.14, 0.25)
        c.line(margin_x, page_height - 95, page_width - margin_x, page_height - 95)

        text_content = re.sub(r"<style[\s\S]*?</style>", "", item_html)
        text_content = re.sub(r"<script[\s\S]*?</script>", "", text_content)
        text_content = re.sub(r"</?(h1|h2|h3|tr|div|p|li)[^>]*>", "\n", text_content)
        text_content = re.sub(r"<[^>]+>", " ", text_content)

        raw_lines = [line.strip() for line in text_content.splitlines() if line.strip()]

        y = page_height - 118
        c.setFont(font_name, 9.5)

        for line in raw_lines:
            if any(skip in line for skip in ("دولة ليبيا", "الجهاز الوطني للقوى المساندة")):
                continue

            words = line.split()
            current_line = []
            for word in words:
                current_line.append(word)
                if len(" ".join(current_line)) > 55:
                    line_str = " ".join(current_line)
                    c.setFont(font_name, 9.5)
                    c.setFillColorRGB(0.06, 0.09, 0.16)
                    c.drawRightString(page_width - margin_x, y, _rtl(line_str))
                    y -= 15
                    current_line = []
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

            if current_line:
                line_str = " ".join(current_line)
                c.setFont(font_name, 9.5)
                c.setFillColorRGB(0.06, 0.09, 0.16)
                c.drawRightString(page_width - margin_x, y, _rtl(line_str))
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
    """Renders HTML document to standalone PDF bytes using the best available engine."""
    # 1. Try WeasyPrint if system C-libraries are present
    try:
        from weasyprint import CSS, HTML

        base_url = settings.BASE_DIR.resolve().as_uri() + "/"
        return HTML(string=html_string, base_url=base_url).write_pdf(
            stylesheets=[CSS(string=_font_face_css())]
        )
    except (ImportError, OSError, Exception):
        pass

    # 2. Try Playwright headless Chromium for 100% pixel-perfect vector PDF
    try:
        return _render_playwright_pdf(html_string)
    except Exception as exc:
        logger.warning("Playwright PDF failed, falling back to ReportLab: %s", exc)

    # 3. Fallback to ReportLab with Unicode Arial font
    return _render_fallback_pdf(html_string)


def render_template_to_pdf(template_name, context=None):
    html_string = render_to_string(template_name, context or {})
    return render_html_to_pdf(html_string)
