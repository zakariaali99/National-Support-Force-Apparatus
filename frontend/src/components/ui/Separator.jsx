import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "../../lib/utils";

/** Thin divider. `decorative` (the default) keeps it out of the a11y tree —
 * pass `decorative={false}` only when the rule genuinely separates two
 * distinct sections a screen-reader user needs announced.
 */
export function Separator({ className, orientation = "horizontal", decorative = true, ...props }) {
  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      decorative={decorative}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  );
}
