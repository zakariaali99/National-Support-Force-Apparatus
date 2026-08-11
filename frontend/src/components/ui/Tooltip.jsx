import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "../../lib/utils";

/* =============================================================================
   Tooltip — follows the six conventions documented in Button.jsx.

   TWO RULES THAT ARE NOT STYLE PREFERENCES, they are correctness:

   1. A TOOLTIP IS NOT AN ACCESSIBLE NAME.
      Radix wires the content as `aria-describedby` on the trigger — a
      *description*, read after the name, and by several screen readers only
      when verbosity is turned up. It does not name the control. So an
      icon-only button still needs its own `aria-label`:

          <Tooltip label="حذف العضو">
            <Button size="icon" aria-label="حذف العضو"><Trash2 aria-hidden /></Button>
          </Tooltip>

      Wrapping is not labelling. Without the aria-label that button is
      announced as "button" and is unreachable by voice control, which
      addresses controls by their visible/accessible name.

   2. NOTHING CRITICAL LIVES ONLY IN A TOOLTIP.
      It opens on hover and on keyboard focus. Touch has neither — a tap on
      the trigger fires the trigger. So a reason a control is disabled, a
      validation rule, a units hint, or anything a user must have to complete
      the task belongs in visible copy (helper text, an inline note, the
      empty state). Tooltips carry supplementary hints only.
   ========================================================================== */

/** Mount ONCE near the app root. Radix requires a provider in the tree, and a
 * single shared one is what makes the "skip the delay when moving between
 * adjacent tooltips" behaviour work — with a provider per tooltip, every hop
 * along a toolbar re-pays the full open delay. */
export const TooltipProvider = TooltipPrimitive.Provider;

const contentClasses = [
  /* Inverted surface. A tooltip that uses `bg-surface` reads as one more card
     floating over the page; inverting it is what makes it read as a transient
     overlay. fg/bg are a guaranteed pair in both themes, so contrast holds
     without a per-theme override. */
  "z-50 max-w-xs text-balance",
  "rounded-control bg-fg px-2.5 py-1.5 text-caption text-bg shadow-overlay",
  /* No border: on an inverted ground `border-border` is invisible and
     `border-strong` draws a halo. The shadow carries the elevation. */
  /* `fadeIn` is a keyframe declared in index.css. Referencing it through an
     arbitrary animation keeps us off the transitional `.animate-fade-in`
     class that Phase 7 deletes. Only the delayed open animates — an
     instant-open (moving between adjacent triggers) should feel like the
     same tooltip sliding across, not a new one fading in each time. */
  "data-[state=delayed-open]:animate-[fadeIn_var(--duration-fast)_var(--ease-out-soft)]",
  "motion-reduce:animate-none",
].join(" ");

/**
 * Convenience wrapper: `<Tooltip label="...">{trigger}</Tooltip>`.
 *
 * @param {object} props
 * @param {import('react').ReactNode} [props.label]  Supplementary hint. Falsy
 *   renders the child bare rather than an empty bubble, so callers can pass a
 *   conditional label without branching at the call site.
 * @param {import('react').ReactElement} props.children  Exactly one element —
 *   it becomes the trigger via `asChild`, so it must forward ref and props.
 * @param {'top'|'right'|'bottom'|'left'} [props.side]  Physical, not logical:
 *   this is Radix's collision-aware positioning API, and it already flips
 *   left/right itself from the DirectionProvider mounted in main.jsx. Do not
 *   pass `dir` here.
 * @param {'start'|'center'|'end'} [props.align]
 * @param {number} [props.delayDuration]
 */
export function Tooltip({ label, children, side = "top", align = "center", delayDuration = 300 }) {
  if (!label) return children;

  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content side={side} align={align} sideOffset={6} className={cn(contentClasses)}>
          {label}
          {/* Ties the bubble to its trigger when several sit close together.
              Filled with the same token as the surface so the seam is
              invisible; `aria-hidden` is applied by Radix already. */}
          <TooltipPrimitive.Arrow className="fill-fg" width={11} height={5} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
