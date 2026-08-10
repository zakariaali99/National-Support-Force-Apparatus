import re
import unicodedata

# Arabic diacritics (tashkeel/harakat, U+064B-U+065F and the extended
# Quranic annotation range U+0610-U+061A/U+06D6-U+06ED) plus tatweel/kashida
# (U+0640) — written as \u escapes rather than literal characters to keep
# this file unambiguous in any editor/encoding.
_TASHKEEL_RE = re.compile(
    "[ؐ-ًؚ-ٰٟۖ-ۭـ]"
)
_CHAR_MAP = str.maketrans(
    {
        "أ": "ا",  # أ -> ا
        "إ": "ا",  # إ -> ا
        "آ": "ا",  # آ -> ا
        "ٱ": "ا",  # ٱ -> ا
        "ة": "ه",  # ة -> ه
        "ى": "ي",  # ى -> ي
    }
)
_ARABIC_INDIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
_EXTENDED_ARABIC_INDIC_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")


def normalize_ar(text):
    """Normalize Arabic text for search matching.

    Strips diacritics/tatweel, unifies alef/teh-marbuta/alef-maqsura
    variants, collapses whitespace, casefolds. Store the result in
    Member.search_name and search against THAT column with a plain
    (engine-portable) LIKE — without this, a user typing "احمد" won't find
    a record stored as "أحمد" even though both refer to the same name, and
    they'll conclude search is broken.
    """
    if not text:
        return ""
    text = unicodedata.normalize("NFKC", text)
    text = _TASHKEEL_RE.sub("", text)
    text = text.translate(_CHAR_MAP)
    text = re.sub(r"\s+", " ", text).strip()
    return text.casefold()


def normalize_digits(text):
    """Convert Arabic-Indic (U+0660-U+0669) and Extended Arabic-Indic
    (U+06F0-U+06F9) digits to Latin (0-9). Phone keyboards set to an
    Arabic locale commonly produce these even though the UI displays
    Latin numerals throughout the app.
    """
    if not text:
        return text
    return text.translate(_ARABIC_INDIC_DIGITS).translate(_EXTENDED_ARABIC_INDIC_DIGITS)
