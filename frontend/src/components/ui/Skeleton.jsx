import { forwardRef } from "react";

import { cn } from "../../lib/utils";

/* =============================================================================
   Skeleton — placeholder geometry for content that has not arrived.

   THREE THINGS THE CALL SITE OWNS, because a component cannot own them:

   1. `aria-busy`. Skeletons are aria-hidden here (see below), so to assistive
      tech a loading screen is simply an empty region — silence, with no
      indication that anything is coming. The *region* has to say so:

        <div aria-busy={isLoading} aria-live="polite">
          {isLoading ? <TableSkeleton /> : <DataTable rows={rows} />}
        </div>

      Without that, the only announcement a screen-reader user gets is the
      content appearing, with no warning that it was pending.

   2. Matching the real layout. A skeleton whose blocks are a different height
      than the content that replaces them causes a reflow jump at exactly the
      moment the user starts reading. Size these to the real thing.

   3. Not showing at all under ~200ms. A skeleton that flashes and vanishes
      reads as a glitch; prefer rendering nothing for a fast response.

   The skeletons themselves are aria-hidden: they are decorative geometry, and
   announcing a dozen empty divs is worse than announcing nothing.
   ========================================================================== */

/* The fill is a faint ink tint mixed INTO `--surface-raised` rather than
   `bg-surface-raised` alone. On light, `--surface-raised` (#faf8f4) against a
   `--surface` card (#ffffff) is a ~2% step — a skeleton you cannot see, and
   `animate-pulse` only animates opacity, so pulsing an invisible block stays
   invisible. Mixing in `--fg` works in both modes without a `dark:` override:
   on light it darkens toward ink, on dark it lightens toward the warm
   off-white, so the block always steps AWAY from whatever it sits on.
   colour-mix against tokens is fine; an arbitrary alpha of a brand hue is not. */
const SKELETON_FILL = "bg-[color-mix(in_srgb,var(--fg)_7%,var(--surface-raised))]";

/**
 * @param {object} props
 * @param {string} [props.className]  Size it here — `h-4 w-1/3`, `h-12 w-12
 *                                    rounded-full` for an avatar. twMerge lets
 *                                    a passed radius override the default.
 */
export const Skeleton = forwardRef(function Skeleton({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "rounded-control",
        SKELETON_FILL,
        "animate-pulse motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  );
});

/** Placeholder for a single Card: avatar + two title lines, then a text block. */
export function CardSkeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-card border border-border bg-surface p-6 space-y-4", className)}
    >
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="space-y-2 pt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

/**
 * Placeholder for a DataTable: a header bar then `rows` × `cols` cells.
 *
 * The first cell in each row is wider than the rest because the first column
 * in this app is almost always the member name — matching the real column
 * rhythm is what stops the swap from looking like a layout shift.
 */
export function TableSkeleton({ rows = 5, cols = 4, className }) {
  return (
    <div
      aria-hidden="true"
      className={cn("overflow-x-auto rounded-card border border-border bg-surface", className)}
    >
      <div className="border-b border-border bg-surface-raised p-4">
        <Skeleton className="h-5 w-1/4" />
      </div>
      <div className="space-y-4 p-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 py-2">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <Skeleton key={colIndex} className={cn("h-4", colIndex === 0 ? "w-1/3" : "w-1/5")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
