/* =============================================================================
   Num — the wrapper every Latin numeral in this app is rendered through.
   Conventions per Button.jsx.

   The page is dir="rtl" and the copy is Arabic, but force numbers, national
   numbers, phone numbers, dates and counts are Latin digits. The bidi
   algorithm treats digits as weakly-directional, so a bare number sitting
   between Arabic words gets reordered against its neighbours the moment
   punctuation is involved — "2024-01-15" renders as "15-01-2024", and a range
   like "5 - 12" flips. That is not a styling nit; it silently shows the wrong
   national number.

   index.css already declares the fix on `[data-num]`:
     direction: ltr        — the digit run reads left-to-right internally
     unicode-bidi: isolate — and cannot merge with the runs on either side
     font-variant-numeric: tabular-nums — columns of figures line up

   This component exists so that rule has exactly one application point. If a
   number is on screen and not inside <Num>, it is a bug.
   ========================================================================== */

/**
 * @param {object} props
 * @param {import('react').ReactNode} [props.children]  The numeral run.
 */
export function Num({ children, className }) {
  return (
    <span data-num className={className}>
      {children}
    </span>
  );
}
