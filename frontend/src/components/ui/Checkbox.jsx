import { forwardRef } from "react";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";

import { cn } from "../../lib/utils";

/* =============================================================================
   Checkbox — follows the six conventions documented in Button.jsx.

   Radix renders a real <button role="checkbox">, not an <input>. Two things
   follow from that and are worth knowing before you use it:

     - <button> is a labelable element, so BOTH association patterns work:
       `<Label htmlFor="x" />` + `<Checkbox id="x" />`, and a <label> wrapped
       around the checkbox and its text. RolesPage uses the wrapped form for
       its permission grid; clicking anywhere on the row toggles the box.
     - the tri-state is `checked={true | false | "indeterminate"}`, and it is
       reflected as `data-state` on the root, which is what selects the glyph
       below. There is no `indeterminate` prop.

   The box is 20px and deliberately NOT `rounded-control` (8px on a 20px box
   reads as a squircle, i.e. as a radio). `rounded-sm` (4px) keeps it square
   enough to be read as "multi-select" at a glance in a dense grid.
   ========================================================================== */

export const Checkbox = forwardRef(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        [
          /* Named group so the indicator can select on the root's data-state
             without colliding with an unnamed `group` on a page-level row. */
          "group/checkbox peer relative inline-flex h-5 w-5 shrink-0 items-center justify-center",
          /* border-strong, not border: unchecked, the outline IS the control.
             `border` is the decorative token and fails 3:1. */
          "rounded-sm border border-border-strong bg-surface text-primary-fg",
          "transition-[background-color,border-color] duration-[var(--duration-fast)] ease-out",
          "hover:border-primary",
          /* Checked and indeterminate share one filled treatment — they are
             both "this row is affected", differing only in the glyph. */
          "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
          "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          /* 44px touch target on coarse pointers WITHOUT growing the box.
             A wrapper with `coarse:h-11` would push every row of the RolesPage
             permission grid apart on touch and would not even be clickable —
             padding on a wrapper is not part of the control. An ::after on the
             root belongs to the button itself, so the whole 44px area
             activates it, and because it is absolutely positioned it costs
             zero layout: 20px + (12px x 2) = 44px. */
          "coarse:after:absolute coarse:after:-inset-3 coarse:after:content-['']",
        ].join(" "),
        className
      )}
      {...props}
    >
      {/* Radix mounts the indicator only when checked/indeterminate. Both
          glyphs live here and the root's state picks one, so the component
          works uncontrolled as well — reading `props.checked` would not. */}
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check
          className="h-3.5 w-3.5 group-data-[state=indeterminate]/checkbox:hidden"
          strokeWidth={3}
          aria-hidden="true"
        />
        <Minus
          className="hidden h-3.5 w-3.5 group-data-[state=indeterminate]/checkbox:block"
          strokeWidth={3}
          aria-hidden="true"
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
