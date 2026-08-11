import { forwardRef } from "react";

import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "../../lib/utils";

/* =============================================================================
   Label — the caption for a form control. Conventions per Button.jsx.

   Radix's Label is used rather than a bare <label> for one reason: it forwards
   clicks to the associated control without selecting the label text on a
   double-click, which a native <label> does and which looks like a bug in a
   dense Arabic form.

   `htmlFor` is not optional in practice. A label with no `htmlFor` and no
   wrapped control names nothing, and the field then falls back to its
   placeholder — which is the single most common a11y failure in the old forms.

   The required marker is deliberately TWO nodes:
     - a red asterisk, aria-hidden, for sighted users;
     - a visually-hidden " (مطلوب)" that screen readers actually read.
   An asterisk alone is announced as "star" or skipped entirely depending on
   punctuation settings, so it carries no meaning without the text twin. The
   colour is not the only signal either — the asterisk itself is the signal,
   which keeps this readable for colour-blind users (WCAG 1.4.1).
   ========================================================================== */

/**
 * @param {object}  props
 * @param {string}  [props.htmlFor]   id of the control this labels.
 * @param {boolean} [props.required]  Appends the required marker. Set this
 *                                    from the same source that sets the
 *                                    control's `required`/schema rule, never
 *                                    by hand on one side only.
 */
export const Label = forwardRef(function Label({ className, required = false, children, ...props }, ref) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn("inline-flex items-center text-label font-semibold text-fg", className)}
      {...props}
    >
      {children}
      {required && (
        <>
          {/* ms-1, not ml-1: under RTL the marker sits to the LEFT of the
              text and the gap has to be on its start edge. */}
          <span className="ms-1 text-danger" aria-hidden="true">
            *
          </span>
          <span className="sr-only">{" (مطلوب)"}</span>
        </>
      )}
    </LabelPrimitive.Root>
  );
});
