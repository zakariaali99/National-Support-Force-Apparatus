import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "../../lib/utils";

/** Mount ONCE near the app root. Radix requires a provider in the tree, and
 * a single shared one is what makes the "skip the delay when moving between
 * adjacent tooltips" behaviour work.
 */
export const TooltipProvider = TooltipPrimitive.Provider;

/** Convenience wrapper: `<Tooltip label="...">{trigger}</Tooltip>`.
 *
 * Note this is hover/focus only — it must never be the *sole* carrier of
 * information (a disabled control still needs its reason available to touch
 * users, who get no hover). Use it for supplementary hints.
 */
export function Tooltip({ label, children, side = "top", align = "center", delayDuration = 300 }) {
  if (!label) return children;

  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          className={cn(
            "z-50 max-w-xs rounded-control border border-border bg-card px-2.5 py-1.5",
            "text-caption text-card-foreground shadow-overlay",
            "data-[state=delayed-open]:animate-fade-in"
          )}
        >
          {label}
          <TooltipPrimitive.Arrow className="fill-card" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
