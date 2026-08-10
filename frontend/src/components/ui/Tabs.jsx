import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "../../lib/utils";

export const Tabs = TabsPrimitive.Root;

/** Horizontally scrollable on narrow screens rather than wrapping — a
 * wrapped tab strip reflows the panel below it on every resize, which reads
 * as the page jumping. Radix handles arrow-key navigation and flips its
 * left/right handling automatically under dir="rtl".
 */
export function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn("flex items-center gap-1 overflow-x-auto border-b border-border/60", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        // min-h-11 ≈ 44px, the minimum comfortable touch target.
        "min-h-11 whitespace-nowrap border-b-2 border-transparent px-3.5 py-2.5 text-caption font-bold",
        "text-muted-foreground outline-none transition-colors hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-t-control",
        "data-[state=active]:border-primary data-[state=active]:text-primary",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      className={cn("pt-5 outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    />
  );
}
