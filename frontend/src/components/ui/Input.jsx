import { forwardRef } from "react";

import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

/* =============================================================================
   Single-line text field. Follows the six conventions in Button.jsx; the
   decisions specific to a text control are noted here.

   HEIGHT AND SIZE ARE LOAD-BEARING, not taste:
     h-11 is 44px, so the field is already a valid coarse-pointer target and
     needs no `coarse:` bump. text-body is 16px, which is the threshold below
     which mobile Safari zooms the viewport on focus and then leaves the user
     zoomed in on a form they now have to pan around. Neither number is free
     to shrink — a 36px/14px field would fail one and trigger the other.

   BORDER: `border-strong`, not `border`. On an input the border IS the
     affordance — it is the only thing that says "you can type here" — so it
     has to clear 3:1 (WCAG 1.4.11). `--border` is the decorative separator
     token and sits well under that.

   FOCUS: nothing here. The base layer draws `outline: 2px solid var(--focus)`
     on :focus-visible and that is deliberately the whole treatment. The old
     input wrote `focus-visible:outline-none` and replaced it with a ring, which
     is how you end up with two focus systems that disagree.

   INVALID: the border alone would be a colour-only signal, so `invalid` also
     sets aria-invalid. The visible error text belongs to the field's label
     group, not to this component — this is the input, not the form row.
   ========================================================================== */

const inputVariants = cva(
  [
    "block w-full h-11 px-3",
    "rounded-control border bg-surface text-body text-fg",
    "placeholder:text-fg-subtle",
    "transition-[border-color,background-color,color] duration-[var(--duration-fast)] ease-out",
    /* Disabled is NOT `opacity-50`. Half-opacity text on a form field is a
       readability problem where the value still matters — UsersPage disables
       the username while editing precisely so the user can read which account
       they are editing. A filled ground plus the flattened decorative border
       reads as inert without making the content harder to see. */
    "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-raised disabled:text-fg-subtle",
  ].join(" "),
  {
    variants: {
      invalid: {
        true: "border-danger",
        false: "border-border-strong",
      },
    },
    defaultVariants: { invalid: false },
  }
);

/**
 * @param {object}  props
 * @param {string}  [props.type]     Any text-like native type (text, password,
 *                                   email, number, date, tel…). Not for
 *                                   checkbox/radio — those have their own
 *                                   components and these classes would fight
 *                                   the native control.
 * @param {boolean} [props.invalid]  Draws the danger border and sets
 *                                   aria-invalid. Pair it with a visible
 *                                   message next to the field; the colour on
 *                                   its own is not an accessible error signal.
 */
export const Input = forwardRef(function Input({ className, type = "text", invalid = false, ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(inputVariants({ invalid }), className)}
      // Before the spread, so a caller that manages aria-invalid itself (or
      // hands one down from a form library) still wins.
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

export { inputVariants };
