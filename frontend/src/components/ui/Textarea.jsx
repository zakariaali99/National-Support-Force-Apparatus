import { forwardRef } from "react";

import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

/* =============================================================================
   Multi-line text field. Same chrome as Input — border-strong outline,
   bg-surface, rounded-control, text-body, inherited focus outline, and the
   same non-opacity disabled treatment. See Input.jsx for why each of those is
   what it is; the differences are below.

   NOTE: the base recipe is intentionally duplicated rather than imported from
   Input.jsx. Input, Textarea and Select are three controls that must look
   identical, and the right home for that is a shared `fieldVariants` — but
   Select has not been rebuilt yet, so extracting it now would mean touching a
   file mid-rewrite. When Select lands, hoist the shared classes out of all
   three. Until then: change one, change the others.

   HEIGHT: min-h-24 (96px) is a floor, not a height. There is no `h-*` here, so
     a caller's `rows` still sizes the box — MemberForm passes rows={4}, which
     lands above the floor and therefore wins. A floor rather than a fixed
     height is also what lets ProfileExtras pass a shorter `min-h-*` for its
     inline note composer.

   RESIZE: `resize-y`, not the browser default of `resize: both`. Horizontal
     resize on a field inside a grid or a flex row lets the user drag the
     control wider than its container and break the layout around it; vertical
     is the axis they actually want.

   PADDING: py-2 as well as px-3, because unlike the 44px single-line field
     there is no fixed height centring the text — without it the first line
     sits against the top border.
   ========================================================================== */

const textareaVariants = cva(
  [
    "block w-full min-h-24 px-3.5 py-2.5 resize-y",
    "rounded-lg border bg-surface text-body-sm text-fg shadow-2xs",
    "placeholder:text-slate-400 dark:placeholder:text-slate-500",
    "focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-500/15",
    "transition-[border-color,box-shadow,background-color,color] duration-[var(--duration-fast)] ease-out",
    "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-raised disabled:text-fg-subtle",
  ].join(" "),
  {
    variants: {
      invalid: {
        true: "border-danger focus:border-danger focus:ring-danger/15",
        false: "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600",
      },
    },
    defaultVariants: { invalid: false },
  }
);

/**
 * @param {object}  props
 * @param {boolean} [props.invalid]  Draws the danger border and sets
 *                                   aria-invalid. Pair it with a visible
 *                                   message next to the field; the colour on
 *                                   its own is not an accessible error signal.
 */
export const Textarea = forwardRef(function Textarea({ className, invalid = false, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(textareaVariants({ invalid }), className)}
      // Before the spread, so a caller that manages aria-invalid itself (or
      // hands one down from a form library) still wins.
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

export { textareaVariants };
