import { forwardRef } from "react";

import { cn } from "../../lib/utils";

// Plain native <select>, styled to match Input — a full Radix Select is
// more than this app needs right now; swap in one later if a screen needs
// custom option rendering.
export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
