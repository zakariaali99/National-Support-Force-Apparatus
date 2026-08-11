import { forwardRef } from "react";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { cn } from "../../lib/utils";

/* =============================================================================
   RadioGroup — follows the six conventions documented in Button.jsx.

   Shape carries the semantics: this is a circle where Checkbox is a square,
   because that is the only cue that says "one of these" rather than "any of
   these" before the user has clicked anything.

   Keyboard: the group is ONE tab stop and arrow keys move between items
   (roving tabindex, handled by Radix). Which arrow means "next" flips under
   RTL — Radix reads that from the DirectionProvider mounted in main.jsx, so
   never pass `dir` here; passing it would pin the group to one direction and
   desync it from the rest of the app.

   Usage:
     <RadioGroup value={scope} onValueChange={setScope}>
       <div className="flex items-center gap-2">
         <RadioGroupItem value="all" id="scope-all" />
         <Label htmlFor="scope-all">الكل</Label>
       </div>
     </RadioGroup>

   Every item needs an accessible name — an associated <Label> (or a wrapping
   <label>, since Radix renders a labelable <button>), or `aria-label`.
   ========================================================================== */

export const RadioGroup = forwardRef(function RadioGroup({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      // `grid` rather than `flex flex-col` so a caller can override to
      // `grid-cols-2` with a single class and keep the same gap.
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
});

export const RadioGroupItem = forwardRef(function RadioGroupItem({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        [
          "relative inline-flex h-5 w-5 shrink-0 items-center justify-center",
          "rounded-full border border-border-strong bg-surface",
          "transition-[background-color,border-color] duration-[var(--duration-fast)] ease-out",
          "hover:border-primary",
          "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          /* Same coarse-pointer treatment as Checkbox: 20px + (12px x 2) =
             44px of hit area on the control itself, no layout cost. See the
             comment in Checkbox.jsx for why this is not a wrapper element. */
          "coarse:after:absolute coarse:after:-inset-3 coarse:after:content-['']",
        ].join(" "),
        className
      )}
      {...props}
    >
      {/* The dot is primary-fg on the filled circle — the same figure/ground
          pairing as the Check glyph in Checkbox, so the two controls read as
          one family at a distance. */}
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="block h-2 w-2 rounded-full bg-primary-fg" aria-hidden="true" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
