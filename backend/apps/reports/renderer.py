"""PDF rendering backend. Selected via settings.REPORTS_PDF_ENGINE so a
future host that lacks WeasyPrint's system libs (Pango/Cairo) can switch
engines without touching call sites — see PLAN.md's "Printing / PDF
pipeline" section. Only "weasyprint" is implemented today; a pure-Python
fallback is future work (tracked in NEXT.md), not needed for the local/VPS
deployment target this project is built for right now.
"""

from django.conf import settings
from django.template.loader import render_to_string

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


def render_html_to_pdf(html_string):
    """Renders one HTML document (already-complete, with its own <style>)
    to standalone PDF bytes, sharing the Cairo font-face declaration so
    every section's numerals/Arabic text render identically regardless of
    which template produced them.
    """
    engine = getattr(settings, "REPORTS_PDF_ENGINE", "weasyprint")
    if engine != "weasyprint":
        raise NotImplementedError(f"Unsupported REPORTS_PDF_ENGINE: {engine}")

    from weasyprint import CSS, HTML

    # base_url must be a real URL (not a bare filesystem path) for
    # WeasyPrint to resolve relative asset references like the seal image
    # below — .as_uri() gives "file:///…/backend/".
    base_url = settings.BASE_DIR.resolve().as_uri() + "/"
    return HTML(string=html_string, base_url=base_url).write_pdf(
        stylesheets=[CSS(string=_font_face_css())]
    )


def render_template_to_pdf(template_name, context=None):
    html_string = render_to_string(template_name, context or {})
    return render_html_to_pdf(html_string)
