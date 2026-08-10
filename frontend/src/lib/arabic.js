/** Client-side mirror of the backend's
 * `apps/members/utils/arabic.py::normalize_ar`.
 *
 * Kept deliberately in lockstep with that function: any client-side
 * filtering (the Combobox's option search) must match on the same
 * normalized form the server searches on, or the two disagree and a user
 * typing "احمد" gets "no results" locally for an option the server would
 * happily have matched as "أحمد". If you change one, change both.
 *
 * Every Arabic character here is written as a \u escape rather than a
 * literal. These are combining marks and RTL letters: as literals they
 * render invisibly or reorder in an editor, which makes the ranges
 * impossible to review and easy to corrupt on a careless edit.
 */

// Quranic annotation U+0610-U+061A, tashkeel/harakat U+064B-U+065F,
// superscript alef U+0670, Quranic annotation U+06D6-U+06ED,
// tatweel/kashida U+0640.
const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;

// U+0623 alef-hamza-above, U+0625 alef-hamza-below, U+0622 alef-madda,
// U+0671 alef-wasla  -> U+0627 plain alef
// U+0629 teh-marbuta -> U+0647 heh
// U+0649 alef-maqsura -> U+064A yeh
const CHAR_MAP = {
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
  "ٱ": "ا",
  "ة": "ه",
  "ى": "ي",
};
const CHAR_MAP_RE = /[أإآٱةى]/g;

export function normalizeAr(text) {
  if (!text) return "";
  return String(text)
    .normalize("NFKC")
    .replace(TASHKEEL, "")
    .replace(CHAR_MAP_RE, (c) => CHAR_MAP[c])
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Arabic-Indic U+0660-U+0669, Extended Arabic-Indic U+06F0-U+06F9.
const ARABIC_INDIC = /[٠-٩]/g;
const EXTENDED_ARABIC_INDIC = /[۰-۹]/g;

/** Arabic-Indic and Extended Arabic-Indic digits to Latin (0-9). Mirrors
 * the backend's `normalize_digits`. The UI renders Latin numerals
 * everywhere, but an Arabic-locale phone keyboard still emits these.
 */
export function normalizeDigits(text) {
  if (!text) return text;
  return String(text)
    .replace(ARABIC_INDIC, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(EXTENDED_ARABIC_INDIC, (d) => String(d.charCodeAt(0) - 0x06f0));
}
