import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { cn } from "../../lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

export function DropdownMenuContent({ className, align = "end", sideOffset = 8, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-56 rounded-card border border-border bg-card p-2 text-card-foreground shadow-overlay",
          "data-[state=open]:animate-slide-up",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

/** `variant="destructive"` styles logout/delete entries consistently — this
 * had been hand-rolled with a long className at each call site.
 */
export function DropdownMenuItem({ className, variant = "default", ...props }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-control px-3 py-2 text-body font-medium outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring",
        variant === "destructive"
          ? "text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
          : "text-card-foreground hover:bg-secondary focus:bg-secondary",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }) {
  return <div className={cn("px-3 py-2", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("my-1.5 h-px bg-border/60", className)}
      {...props}
    />
  );
}
