import { forwardRef } from "react";

import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "../../lib/utils";

/* =============================================================================
   Switch — follows the six conventions documented in Button.jsx.

   Prop API is unchanged from the previous version: `checked`,
   `onCheckedChange`, `disabled`, `id`, `className` all pass through to the
   Radix root, so FactionsPage / RanksPage / UsersPage / FieldRequirementsPage
   keep working untouched. `peer` is kept on the root for the same reason.

   A switch has no visible label of its own — pair it with `<Label htmlFor>`
   (the pattern already used across the settings pages) or give it an
   `aria-label`. It is toggled by click, Space and Enter.

   --- geometry, because the thumb travel is derived from it ---------------
   track  h-6 w-11        24 x 44
   border 1px each side   -> inner box 22 x 42
   p-0.5  2px each side   -> content   18 x 38
   thumb  18px            -> fits the content height exactly, and travels
                             38 - 18 = 20px  (= translate-x-5)
   Change any one of those four numbers and the translate below must change
   with it, which is why they are written down here rather than tuned by eye.

   --- why the translate needs an rtl: variant -----------------------------
   Everything else in this file is direction-agnostic: the track is a flex row,
   so its main-start follows the writing direction and the thumb parks itself
   against the RIGHT edge under dir="rtl" with no help from us. `transform`,
   however, has no logical form — `translate-x` is defined in PHYSICAL screen
   axes, and a positive value moves an element toward screen-right in every
   direction mode. So under RTL the "on" position is 20px toward screen-LEFT
   of a thumb that is already parked on the right, i.e. the same magnitude
   negated. Without the rtl: variant the thumb slides straight out of its own
   track on the checked state.
   ========================================================================== */

export const Switch = forwardRef(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        [
          "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5",
          /* border-strong: unchecked, the outline is the only thing separating
             the track from the surface it sits on, so it has to clear 3:1. */
          "border border-border-strong bg-surface-raised",
          "transition-[background-color,border-color] duration-[var(--duration-fast)] ease-out",
          "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          /* 44px touch target on coarse pointers. The track is already 44px
             wide, so only the height needs expanding: 24px + (10px x 2) = 44.
             An absolutely positioned ::after on the control itself, so the
             whole area activates it without changing the row height in the
             settings tables. */
          "coarse:after:absolute coarse:after:-inset-y-2.5 coarse:after:content-['']",
        ].join(" "),
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-[1.125rem] w-[1.125rem] rounded-full shadow-raised",
          /* Unchecked the thumb sits on `surface-raised`, where a white thumb
             would be all but invisible on the light theme; `fg-subtle` reads
             clearly on both grounds. Checked it flips to `primary-fg` against
             the filled navy track. */
          "bg-fg-subtle data-[state=checked]:bg-primary-fg",
          "transition-transform duration-[var(--duration-base)] ease-out",
          /* See the header comment: transforms are physical, so RTL negates. */
          "data-[state=checked]:translate-x-5 rtl:data-[state=checked]:-translate-x-5"
        )}
      />
    </SwitchPrimitive.Root>
  );
});
