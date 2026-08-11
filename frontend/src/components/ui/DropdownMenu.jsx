import { forwardRef } from "react";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cva } from "class-variance-authority";
import { Check, Circle } from "lucide-react";

import { cn } from "../../lib/utils";

/* =============================================================================
   DropdownMenu — a menu of ACTIONS hung off a trigger. Conventions per
   Button.jsx. Notes specific to a menu:

   1. No `side` is hardcoded. Radix resolves side/align logically against the
      DirectionProvider in main.jsx and collision-flips against the viewport;
      pinning a physical side breaks both. `align="end"` reads as "aligned to
      the trigger's end edge" in whichever direction is current — under RTL
      that is the LEFT edge. Do not compensate by hand.

   2. Highlight, not hover, is the state that matters. A menu is driven by the
      keyboard as much as the pointer, and Radix sets `data-[highlighted]` for
      BOTH pointer-over and arrow-key navigation. Styling only `hover:` would
      leave keyboard users with no visible position; `hover:` is kept alongside
      it purely so a disabled-but-pointed row still looks inert.

   3. Menu items never take :focus-visible — Radix keeps DOM focus on the
      content element and moves `data-[highlighted]` instead. So the base
      outline in index.css does not apply here, which is exactly why the
      highlight background is not optional decoration. Nothing in this file
      writes `focus-visible:outline-none`.

   4. Items are 40px tall for desktop density and bump to 44px under `coarse:`,
      rather than shrinking desktop to hit the touch floor.

   5. The check/radio indicators sit in a reserved `ps-9` gutter on the START
      side, and every item in a group that contains one gets that gutter — an
      indicator that only exists when checked makes the label shift sideways as
      you toggle it.
   ========================================================================== */

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
/** Required wrapper for DropdownMenuRadioItem — it owns value/onValueChange. */
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const itemVariants = cva(
  [
    "relative flex select-none items-center gap-2.5 h-10 coarse:h-11 px-3",
    "rounded-control text-body",
    "transition-colors duration-[var(--duration-fast)] ease-out",
    // Disabled is inert AND dimmed — pointer-events-none stops a disabled row
    // from swallowing the click that should land on the item behind it.
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "text-fg hover:bg-surface-raised data-[highlighted]:bg-surface-raised",
        /* Sign out, delete, revoke. Text-only red on the resting state and the
           danger SURFACE on highlight — a filled red row in a menu reads as
           already-selected, and the surface/text pair is contrast-checked
           together in index.css. */
        danger:
          "text-danger hover:bg-danger-surface data-[highlighted]:bg-danger-surface",
      },
      /* Reserves the indicator gutter. Set automatically by the checkbox and
         radio items; pass it on a plain item to keep it aligned with them. */
      inset: { true: "ps-9", false: "" },
    },
    defaultVariants: { variant: "default", inset: false },
  }
);

/* `variant="destructive"` is the pre-rebuild name and is still passed by
   UserMenu.jsx (and any page not yet rewritten), so it maps onto `danger`
   rather than being renamed out from under the call sites. */
const LEGACY_VARIANT_ALIASES = { destructive: "danger" };

function resolveVariant(variant) {
  return LEGACY_VARIANT_ALIASES[variant] ?? variant;
}

/**
 * @param {object} props
 * @param {'start'|'center'|'end'} [props.align='end']  Logical, RTL-aware.
 * @param {number} [props.sideOffset=8]
 */
export const DropdownMenuContent = forwardRef(function DropdownMenuContent(
  { className, align = "end", sideOffset = 8, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-56 rounded-card border border-border bg-surface p-1 text-fg shadow-overlay",
          "data-[state=open]:animate-slide-up motion-reduce:animate-none",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

/**
 * @param {object} props
 * @param {'default'|'danger'|'destructive'} [props.variant]  `destructive` is
 *   the legacy spelling of `danger` and stays accepted.
 * @param {boolean} [props.inset]  Adds the indicator gutter so a plain item
 *   lines up with checkbox/radio items in the same group.
 */
export const DropdownMenuItem = forwardRef(function DropdownMenuItem(
  { className, variant = "default", inset, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(itemVariants({ variant: resolveVariant(variant), inset }), className)}
      {...props}
    />
  );
});

/** A toggle row. `checked` / `onCheckedChange` are Radix's, including the
 *  `"indeterminate"` value. The tick is decorative — the row's checked state
 *  is announced through the primitive's role="menuitemcheckbox". */
export const DropdownMenuCheckboxItem = forwardRef(function DropdownMenuCheckboxItem(
  { className, variant = "default", children, checked, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      checked={checked}
      className={cn(itemVariants({ variant: resolveVariant(variant), inset: true }), className)}
      {...props}
    >
      <span className="absolute start-3 inline-flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          {/* Check is non-directional — it must NOT mirror under RTL. */}
          <Check className="h-4 w-4 text-accent-text" aria-hidden="true" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});

/** One option of a DropdownMenuRadioGroup. Same gutter as the checkbox item so
 *  mixed groups stay on one text axis. */
export const DropdownMenuRadioItem = forwardRef(function DropdownMenuRadioItem(
  { className, variant = "default", children, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(itemVariants({ variant: resolveVariant(variant), inset: true }), className)}
      {...props}
    >
      <span className="absolute start-3 inline-flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="h-2 w-2 fill-current text-accent-text" aria-hidden="true" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});

/** A non-interactive heading for a group of items. Not a Radix Label by
 *  default here because call sites (UserMenu) put a whole identity block
 *  inside it; padding and muted colour only, so nested elements keep their
 *  own type. */
export const DropdownMenuLabel = forwardRef(function DropdownMenuLabel(
  { className, inset, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn("px-3 py-2 text-label font-semibold text-fg-subtle", inset && "ps-9", className)}
      {...props}
    />
  );
});

/** Decorative rule — `border`, not `border-strong`: it separates, it is not a
 *  control outline. Negative inline margin so it spans the content's 4px
 *  padding instead of floating inside it. */
export const DropdownMenuSeparator = forwardRef(function DropdownMenuSeparator(
  { className, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
});
