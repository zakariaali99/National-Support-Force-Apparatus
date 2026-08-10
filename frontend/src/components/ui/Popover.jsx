import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "../../lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

/** `align="start"` is direction-aware in Radix — under the app's
 * DirectionProvider dir="rtl" it anchors to the RIGHT edge, which is the
 * correct "start" for this UI. Don't swap it to "end" to compensate.
 */
export function PopoverContent({ className, align = "start", sideOffset = 6, ...props }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-card border border-border bg-card p-1 text-card-foreground shadow-overlay",
          "data-[state=open]:animate-fade-in",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
