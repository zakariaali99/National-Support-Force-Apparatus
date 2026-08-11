import { forwardRef } from "react";

import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "../../lib/utils";

/* =============================================================================
   Separator — a 1px rule between surfaces.

   `bg-border`, never `bg-border-strong`. The two border tokens exist because
   they have different jobs (see index.css): `--border` separates surfaces and
   is decorative, `--border-strong` outlines controls and has to clear 3:1. A
   divider drawn in `border-strong` reads as a control edge and turns a calm
   list into a grid of boxes.

   No directional classes here — horizontal is `w-full`, vertical is `w-px`,
   both axis-neutral, so the component needs nothing for RTL. Radix reads
   direction from the DirectionProvider in main.jsx; do not pass `dir`.
   ========================================================================== */

/**
 * @param {object} props
 * @param {'horizontal'|'vertical'} [props.orientation]
 * @param {boolean} [props.decorative]
 *        Default true, which keeps the rule out of the accessibility tree.
 *        Pass `decorative={false}` only when it genuinely divides two sections
 *        a screen-reader user needs announced — Radix then emits
 *        role="separator", and a page of announced separators is noise.
 *
 * NOTE on vertical: it renders `h-full`, so it collapses to nothing unless the
 * parent establishes a height (a flex row does; a plain block does not).
 */
export const Separator = forwardRef(function Separator(
  { className, orientation = "horizontal", decorative = true, ...props },
  ref
) {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      orientation={orientation}
      decorative={decorative}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        className
      )}
      {...props}
    />
  );
});
