import { forwardRef } from "react";

import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "../../lib/utils";

/* =============================================================================
   Popover — a positioned surface anchored to a trigger. Conventions per
   Button.jsx.

   Three things worth knowing before you touch this:

   1. `side` is NEVER hardcoded. Radix resolves side/align against the
      direction supplied by the DirectionProvider mounted in main.jsx, and it
      collision-flips against the viewport. Pinning `side="left"` here would
      both fight the RTL resolution and defeat the flip, which is how a
      popover ends up half off-screen on a narrow viewport.

   2. `align="start"` is direction-aware — under dir="rtl" it anchors to the
      RIGHT edge, which is the correct reading-order "start" for this UI. Do
      not swap it to "end" to compensate for what you see on screen.

   3. Focus is left entirely alone. Radix moves focus into the content on open
      and restores it to the trigger on close; the base :focus-visible outline
      in index.css draws on whatever inside receives it. Nothing here writes
      `focus-visible:outline-none`.
   ========================================================================== */

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

/**
 * @param {object} props
 * @param {'start'|'center'|'end'} [props.align='start']  Logical, RTL-aware.
 * @param {number} [props.sideOffset=6]  Gap from the trigger, in px.
 *
 * Consumers that need the popover to match the trigger's width use
 * `className="w-(--radix-popover-trigger-width)"` (Combobox does) — the
 * variable is published by Radix, so it stays correct as the trigger resizes.
 */
export const PopoverContent = forwardRef(function PopoverContent(
  { className, align = "start", sideOffset = 6, ...props },
  ref
) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-card border border-border bg-surface p-1 text-fg shadow-overlay",
          // The overlay shadow is the elevation cue in light mode; in dark the
          // surface stepping up from --bg does the work. Both are token-driven,
          // so nothing here needs a `dark:` branch.
          "data-[state=open]:animate-fade-in motion-reduce:animate-none",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
