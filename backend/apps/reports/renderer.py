"""PDF rendering backend — Playwright Chromium with WeasyPrint fallback."""

import logging
import os
import subprocess
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

FONT_DIR = settings.BASE_DIR / "static" / "fonts"


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


def _render_playwright_pdf(html_string):
    """Renders HTML string to high-fidelity vector PDF via local Playwright Chromium instance."""
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
    await page.setContent(html, { waitUntil: "networkidle", timeout: 25000 });
    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
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


def render_html_to_pdf(html_string):
    """Renders HTML document to standalone PDF bytes using the best available engine."""
    # 1. Try Playwright headless Chromium for 100% pixel-perfect vector PDF matching the browser print output
    try:
        return _render_playwright_pdf(html_string)
    except Exception as exc:
        logger.warning("Playwright PDF failed, attempting WeasyPrint fallback: %s", exc)

    # 2. Try WeasyPrint if system C-libraries are present
    try:
        from weasyprint import CSS, HTML

        base_url = settings.BASE_DIR.resolve().as_uri() + "/"
        return HTML(string=html_string, base_url=base_url).write_pdf(
            stylesheets=[CSS(string=_font_face_css())]
        )
    except Exception as exc:
        logger.error("WeasyPrint PDF generation failed: %s", exc)

    # No silent corruption: the old ReportLab fallback produced official
    # documents with broken/overlapping Arabic — fail loudly instead.
    raise RuntimeError(
        "PDF rendering failed: both Playwright and WeasyPrint engines are unavailable or errored. "
        "Install/repair the frontend Playwright Chromium or the WeasyPrint system libraries."
    )


def render_template_to_pdf(template_name, context=None):
    html_string = render_to_string(template_name, context or {})
    return render_html_to_pdf(html_string)
