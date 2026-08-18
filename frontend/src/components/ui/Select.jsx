import { Children, Fragment, forwardRef, isValidElement } from "react";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "../../lib/utils";

/* =============================================================================
   Select — Radix listbox with a transitional native fallback.

   Follows the six conventions documented at the top of Button.jsx (semantic
   tokens, the type scale, logical properties, focus never removed, >= 44px on
   coarse pointers, disabled is more than opacity). Two things are specific to
   this component and worth reading before you change it:

   A. TWO RENDER PATHS, ONE LOOK. `Select` dispatches: legacy call sites get a
      styled native <select>, everyone else gets Radix. Both paths share
      `controlClasses` below, so the two are pixel-identical at rest and a
      change to one cannot drift from the other. See the LEGACY block for the
      removal plan.

   B. NO cva. Button uses cva because it has 5 variants x 5 sizes. This control
      has exactly one shape (h-11, the form-field height), so a shared constant
      expresses the contract better than a variant map with one entry — and it
      is the thing that guarantees (A). Add cva here the day a second size is
      genuinely needed, not before.
   ========================================================================== */

/* The rest state of the control, shared by the native <select> and the Radix
   trigger. `border-strong` because the border IS the affordance on a form
   field (`border` alone is decorative and fails 3:1).

   `aria-invalid:border-danger` rather than `border-danger-border`: the
   `-border` half of the status triple is a soft tint meant to outline a filled
   status block, and at ~1.5:1 on a white ground it is not a visible control
   outline. An invalid field must stay above 3:1, so it takes the solid hue. */
const controlClasses = [
  "flex h-11 w-full items-center gap-2 rounded-2xl",
  "border border-slate-200/80 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-body-sm text-foreground shadow-2xs px-4",
  "transition-all duration-200 ease-out",
  "hover:bg-slate-200/60 dark:hover:bg-white/10",
  "focus:outline-none focus:!bg-white dark:focus:!bg-[#101422] focus:border-[#2B95E8] focus:ring-3 focus:ring-[#2B95E8]/20",
  "aria-invalid:border-danger aria-invalid:focus:ring-danger/20",
  "disabled:pointer-events-none disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-white/5",
].join(" ");

/* -----------------------------------------------------------------------------
   Composed Radix API
   -------------------------------------------------------------------------- */

export const SelectRoot = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectGroup = SelectPrimitive.Group;

/**
 * The button that opens the listbox. Icon-only triggers do not exist here —
 * the trigger always shows the current value — but a trigger with no visible
 * <Label> beside it still needs `aria-label` from the caller.
 */
export const SelectTrigger = forwardRef(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        controlClasses,
        "justify-between ps-3 pe-3 text-start",
        // Radix puts data-placeholder on the trigger while nothing is chosen,
        // so the placeholder reads as absent-value rather than as a real one.
        "data-[placeholder]:text-fg-subtle",
        className
      )}
      {...props}
    >
      {/* min-w-0 so a long Arabic label truncates instead of pushing the
          chevron out of the control. */}
      <span className="min-w-0 truncate">{children}</span>
      <SelectPrimitive.Icon asChild>
        {/* Points down, not along the reading axis — a non-directional icon,
            so it must NOT get rtl:-scale-x-100. */}
        <ChevronDown className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

/** Overflow affordances for long lists (ranks, factions, users). */
function ScrollButton({ direction }) {
  const Primitive = direction === "up" ? SelectPrimitive.ScrollUpButton : SelectPrimitive.ScrollDownButton;
  const Icon = direction === "up" ? ChevronUp : ChevronDown;
  return (
    <Primitive className="flex h-8 items-center justify-center bg-surface text-fg-subtle coarse:h-11">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </Primitive>
  );
}

/**
 * The popup. Portalled, so it escapes the overflow/stacking context of a card
 * or a dialog body. `position="popper"` gives us the trigger-width variable,
 * which is what stops the popup from being narrower than the control that
 * opened it.
 */
export const SelectContent = forwardRef(function SelectContent(
  { className, children, position = "popper", sideOffset = 4, ...props },
  ref
) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={sideOffset}
        className={cn(
          "relative z-50 overflow-hidden rounded-card border border-border bg-surface text-fg shadow-overlay",
          "max-h-[min(20rem,var(--radix-select-content-available-height))]",
          "min-w-[var(--radix-select-trigger-width)]",
          // Reuses the `fadeIn` keyframes already defined in index.css. Written
          // as an arbitrary utility rather than the `.animate-fade-in` class so
          // it lands in Tailwind's utilities layer, where the reduced-motion
          // override below can actually beat it.
          "animate-[fadeIn_var(--duration-fast)_var(--ease-out-soft)_both] motion-reduce:animate-none",
          className
        )}
        {...props}
      >
        <ScrollButton direction="up" />
        <SelectPrimitive.Viewport className="w-full p-1">{children}</SelectPrimitive.Viewport>
        <ScrollButton direction="down" />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

/** Group heading inside the listbox. Not selectable, not a target. */
export const SelectLabel = forwardRef(function SelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn("px-3 py-1.5 text-caption font-semibold text-fg-subtle", className)}
      {...props}
    />
  );
});

export const SelectSeparator = forwardRef(function SelectSeparator({ className, ...props }, ref) {
  return <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
});

/**
 * One option. Radix moves DOM focus onto the highlighted item, so the
 * highlight is drawn with `data-[highlighted]` — the focus outline from the
 * base layer still appears for keyboard users on top of it, and is left alone
 * rather than suppressed.
 */
export const SelectItem = forwardRef(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        // min-h-11 = 44px: a listbox row is a tap target like any other.
        "relative flex min-h-11 w-full cursor-default items-center rounded-control py-2 pe-3 ps-9 text-body select-none",
        "data-[highlighted]:bg-surface-raised",
        // Gold is the only token legible as text here; the weight change means
        // the selected row is not signalled by colour alone.
        "data-[state=checked]:font-semibold data-[state=checked]:text-accent-text",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      {/* `start-3` + `ps-9`: the tick sits on the leading side (right under
          RTL) and every row reserves the space, so labels stay aligned whether
          or not they are selected. */}
      <SelectPrimitive.ItemIndicator className="absolute start-3 inline-flex items-center">
        <Check className="h-4 w-4" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

/* -----------------------------------------------------------------------------
   LEGACY PATH — transitional, delete in Phase 6
   -----------------------------------------------------------------------------
   MemberList, MemberForm, DocumentUpload, ProfileExtras, AuditPage and
   RolesPage still call this component as a native control:

     <Select value={x} onChange={(e) => setX(e.target.value)}>
       <option value="">كل الفصائل</option>
     </Select>

   and MemberForm spreads react-hook-form's `register()` into it, which also
   supplies `onChange` plus a ref that must land on a real form element. Those
   pages are rewritten in Phase 6; until then this branch keeps them working
   AND drags them onto the new tokens, so they stop being the last places in
   the app rendering `border-input` / `bg-card`.

   When the last <option> call site is gone: delete `isLegacyUsage`,
   `NativeSelect`, and the dispatch in `Select` — nothing else references them.
   -------------------------------------------------------------------------- */

/** True when the caller is using this as a native <select>. */
function isLegacyUsage({ onChange, children }) {
  if (typeof onChange === "function") return true;
  return hasNativeOptionChild(children);
}

function hasNativeOptionChild(children) {
  // Children.toArray flattens the `{list.map(...)}` arrays these call sites
  // use, but leaves fragments intact — hence the recursion.
  return Children.toArray(children).some((child) => {
    if (!isValidElement(child)) return false;
    if (child.type === "option" || child.type === "optgroup") return true;
    if (child.type === Fragment) return hasNativeOptionChild(child.props.children);
    return false;
  });
}

const NativeSelect = forwardRef(function NativeSelect({ className, children, ...props }, ref) {
  return (
    /* The wrapper is positioned so the chevron can be, and it is what `className`
       lands on — DocumentUpload passes `max-w-56` expecting it to bound the
       whole control. Utilities aimed at the field itself (a colour, a height)
       will therefore be ignored rather than misplaced; the Phase 6 rewrite
       removes the need for either. */
    <span className={cn("relative flex w-full items-center", className)}>
      <select
        ref={ref}
        // appearance-none drops the platform arrow so both paths draw the same
        // chevron on the same (logical) side; pe-10 reserves its space.
        className={cn(controlClasses, "appearance-none ps-3 pe-10")}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute end-3 h-4 w-4 text-fg-subtle"
        aria-hidden="true"
      />
    </span>
  );
});

/* -----------------------------------------------------------------------------
   Public entry point
   -------------------------------------------------------------------------- */

/** `"عقيد"` or `{ value, label, disabled }` -> `{ value, label, disabled }`. */
function normalizeOption(option) {
  if (option === null || typeof option !== "object") {
    return { value: String(option), label: String(option), disabled: false };
  }
  return {
    value: String(option.value),
    label: option.label ?? String(option.value),
    disabled: Boolean(option.disabled),
  };
}

/**
 * @param {object} props
 * @param {string}   [props.value]          Controlled value (Radix path).
 * @param {Function} [props.onValueChange]  Radix path. Receives the value, not
 *                                          an event — that difference is also
 *                                          how the legacy path is detected.
 * @param {Array}    [props.options]        Shorthand: strings or
 *                                          `{ value, label, disabled }`.
 *                                          Renders trigger + content for you.
 * @param {string}   [props.placeholder]    Shown while nothing is selected.
 * @param {Function} [props.onChange]       LEGACY ONLY — presence of this prop,
 *                                          or of <option> children, switches
 *                                          the component to a native <select>.
 *
 * Composed usage stays available for anything the shorthand cannot express
 * (groups, separators, custom rows):
 *
 *   <Select value={v} onValueChange={setV}>
 *     <SelectTrigger><SelectValue placeholder="اختر الرتبة" /></SelectTrigger>
 *     <SelectContent><SelectItem value="1">عقيد</SelectItem></SelectContent>
 *   </Select>
 *
 * The forwarded ref goes to the native <select> on the legacy path and to the
 * trigger on the shorthand path. Composed usage puts the ref where it belongs
 * itself, on <SelectTrigger>.
 */
export const Select = forwardRef(function Select(props, ref) {
  if (isLegacyUsage(props)) {
    return <NativeSelect ref={ref} {...props} />;
  }

  const {
    // Root-owned props. Everything not listed here is a trigger concern
    // (id, aria-*, className, autoFocus…) and is spread onto the trigger.
    value,
    defaultValue,
    onValueChange,
    open,
    defaultOpen,
    onOpenChange,
    name,
    required,
    disabled,
    // Shorthand-only props, never forwarded to the DOM.
    options,
    placeholder,
    children,
    ...triggerProps
  } = props;

  const rootProps = {
    value,
    defaultValue,
    onValueChange,
    open,
    defaultOpen,
    onOpenChange,
    name,
    required,
    disabled,
  };

  // Composed: the caller supplies trigger and content themselves.
  if (children) {
    return <SelectPrimitive.Root {...rootProps}>{children}</SelectPrimitive.Root>;
  }

  // Radix reserves the empty string for "clear the selection", so an
  // <Item value=""> throws. Legacy lists lead with `<option value="">كل ...`,
  // which is exactly what gets pasted in during a migration — drop it loudly
  // rather than crashing the page. Model an all/none row as a sentinel value
  // ("all") and map it back in the handler.
  const items = (options ?? []).map(normalizeOption).filter((option) => {
    if (option.value !== "") return true;
    if (import.meta.env.DEV) {
      console.warn(
        `[Select] dropped option "${option.label}": Radix reserves value="" for clearing. ` +
          `Use a sentinel value (e.g. "all") and translate it where you read the value.`
      );
    }
    return false;
  });

  return (
    <SelectPrimitive.Root {...rootProps}>
      <SelectTrigger ref={ref} {...triggerProps}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectPrimitive.Root>
  );
});
