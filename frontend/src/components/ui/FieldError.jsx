import { AlertCircle } from "lucide-react";

import { cn } from "../../lib/utils";

/* =============================================================================
   FieldError — the validation message under a single form control.
   Conventions per Button.jsx.

   Two things make this more than a red <p>:

   1. It renders NOTHING when there is no message, rather than an empty node.
      `role="alert"` is an assertive live region, and a region that is already
      in the DOM only announces when its contents change — but an empty one
      also announces stray whitespace, and several browsers announce nothing at
      all for text inserted into a region that mounted empty in the same frame.
      Mounting the whole element with the message inside is the behaviour that
      is consistent across screen readers.

   2. The icon carries the meaning that colour alone would (WCAG 1.4.1). Red
      text next to black text is invisible to a colour-blind user; a red
      warning glyph is not.

   The caller owns the wiring: pass the same `id` to the control's
   `aria-describedby` (and set `aria-invalid` on it) so the message is read
   when focus lands on the field, not only when it appears.
   ========================================================================== */

/**
 * @param {object} props
 * @param {string} [props.id]        Point the control's `aria-describedby` here.
 * @param {import('react').ReactNode} [props.children]  Falsy renders nothing.
 */
export function FieldError({ id, className, children, ...props }) {
  if (!children) return null;

  return (
    <p
      id={id}
      role="alert"
      className={cn("flex items-start gap-1.5 text-caption text-danger", className)}
      {...props}
    >
      {/* mt-px nudges the glyph onto the first line's baseline; the message can
          wrap to several lines and the icon must stay pinned to the top. */}
      <AlertCircle className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
