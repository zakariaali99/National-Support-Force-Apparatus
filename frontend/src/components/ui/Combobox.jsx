import { forwardRef, useRef, useState } from "react";

import { Command } from "cmdk";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { normalizeAr } from "../../lib/arabic";
import { cn } from "../../lib/utils";

/* =============================================================================
   Searchable single-select. Replaces the native <select> on the rank and
   faction pickers, which are long enough (40+ entries) that a native dropdown
   stops being usable — you cannot type-ahead into one in Arabic on any
   platform we support.

   THE THING THIS FILE EXISTS FOR — do not remove it:
   cmdk ships a fuzzy Latin scorer as its default `filter`. Against Arabic it
   is worse than useless: a user typing "احمد" gets "لا توجد نتائج" for an
   option labelled "أحمد", because the alef carries a hamza the user did not
   type and no keyboard makes easy. So the filter below runs both sides
   through `normalizeAr` — the same normalization the backend searches with
   (see lib/arabic.js) — and does a plain substring test. Client and server
   therefore agree on what "matches", which is the whole point.

   Conventions per Button.jsx: semantic tokens only, the type scale only,
   logical properties only, focus inherited from the base layer, >= 44px
   targets on coarse pointers, disabled communicated by more than opacity.
   ========================================================================== */

/** cmdk uses an item's `value` as its identity AND as what it filters on, and
 *  it treats an empty value as "never matches" — so an option carrying the
 *  empty string (a "بدون تحديد" entry) would silently vanish from the list.
 *  Fall back to the label for identity in that one case. Actual matching is
 *  done against `keywords`, so the id never leaks into search results. */
const itemKey = (option) => String(option.value ?? "") || String(option.label ?? "");

/**
 * @param {object}   props
 * @param {Array<{value: string|number, label: string, disabled?: boolean}>} [props.options]
 * @param {string|number} [props.value]    Compared as a STRING throughout: the id
 *                                         arrives from the API as a number and
 *                                         comes back out of a form as text.
 * @param {(value: string) => void} [props.onChange]  Always called with a string.
 * @param {string}   [props.placeholder]       Trigger text when nothing is chosen.
 * @param {string}   [props.searchPlaceholder] Search field placeholder + its
 *                                             accessible name.
 * @param {string}   [props.emptyText]         Shown when the query matches nothing.
 * @param {boolean}  [props.disabled]
 * @param {string}   [props.id]                For a <Label htmlFor>.
 *
 * Controlled only. With react-hook-form use a <Controller>, not register() —
 * this renders no native <select> for RHF to bind to. The forwarded ref lands
 * on the trigger, so `field.ref` still focuses the control on a failed submit.
 */
export const Combobox = forwardRef(function Combobox(
  {
    options = [],
    value,
    onChange,
    placeholder = "اختر...",
    searchPlaceholder = "بحث...",
    emptyText = "لا توجد نتائج",
    disabled = false,
    id,
    className,
    ...props
  },
  ref
) {
  const [open, setOpen] = useState(false);
  // cmdk's *highlighted* row, which is not the same thing as the chosen value.
  const [activeKey, setActiveKey] = useState("");
  const searchRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value ?? ""));

  function handleOpenChange(next) {
    // Seed the highlight with the current selection on open. cmdk scrolls the
    // highlighted row into view on mount, so a 40-item rank list opens at the
    // member's current rank and the arrow keys continue from there instead of
    // dumping you at the top of the list every time.
    if (next) setActiveKey(selected ? itemKey(selected) : "");
    setOpen(next);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          id={id}
          // Radix supplies aria-expanded / aria-controls / aria-haspopup on the
          // trigger already; restating them here would only risk them drifting.
          role="combobox"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-control",
            // border-strong, not border: on a control the border IS the
            // affordance and has to clear 3:1.
            "border border-border-strong bg-surface px-3 text-body text-fg",
            "transition-[background-color,border-color] duration-[var(--duration-fast)] ease-out",
            "hover:bg-surface-raised",
            // Error state, driven by whatever aria-invalid the form passes down.
            "aria-[invalid=true]:border-danger-border",
            "disabled:pointer-events-none disabled:opacity-50",
            className
          )}
          {...props}
        >
          <span className={cn("min-w-0 truncate text-start", !selected && "text-fg-subtle")}>
            {selected ? selected.label : placeholder}
          </span>
          {/* Vertical glyph — nothing to mirror, so no rtl:-scale-x-100 here. */}
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-(--radix-popover-trigger-width) overflow-hidden p-0"
        // Radix would focus the first tabbable child, which happens to be the
        // search field — but only by accident of DOM order. Say it outright.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          searchRef.current?.focus();
        }}
        // onCloseAutoFocus is deliberately NOT overridden: Radix's default
        // returns focus to the trigger, which is what we want after Escape,
        // after a selection, and after an outside click alike.
      >
        <Command
          // Renders cmdk's visually-hidden <label> for the search field, so it
          // has a real accessible name rather than leaning on its placeholder.
          label={searchPlaceholder}
          value={activeKey}
          onValueChange={setActiveKey}
          filter={(itemValue, search, keywords) => {
            const needle = normalizeAr(search);
            if (!needle) return 1;
            // Match on the label only. `itemValue` is the option id, and an id
            // of "12" matching a search for "12" is noise, not a result.
            return normalizeAr((keywords ?? []).join(" ")).includes(needle) ? 1 : 0;
          }}
          className="flex flex-col"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
            <Command.Input
              ref={searchRef}
              placeholder={searchPlaceholder}
              className={cn(
                "h-11 w-full min-w-0 bg-transparent text-body text-fg placeholder:text-fg-subtle",
                // The base layer's 2px focus outline is kept, just pulled
                // inside the row so it does not collide with the popover's own
                // rounded border two pixels away.
                "focus-visible:-outline-offset-2"
              )}
            />
          </div>

          {/* max-h so a long faction list scrolls instead of running off the
              viewport; overscroll-contain so hitting the end of that scroll
              does not start scrolling the form underneath. */}
          <Command.List
            label={placeholder}
            className="max-h-64 overflow-y-auto overscroll-contain p-1"
          >
            <Command.Empty className="px-3 py-6 text-center text-caption text-fg-subtle">
              {emptyText}
            </Command.Empty>

            {options.map((option) => {
              const isChosen = String(option.value) === String(value ?? "");
              return (
                <Command.Item
                  key={itemKey(option)}
                  value={itemKey(option)}
                  // What the filter above actually reads. Keeping the label out
                  // of `value` also means two factions sharing a name no longer
                  // collide into one row.
                  keywords={[String(option.label ?? "")]}
                  disabled={option.disabled}
                  // cmdk spends aria-selected on the keyboard highlight, so it
                  // cannot also carry "this is the stored value". aria-current
                  // does that job without fighting it.
                  aria-current={isChosen || undefined}
                  onSelect={() => {
                    onChange?.(String(option.value));
                    setOpen(false);
                  }}
                  className={cn(
                    "flex min-h-10 cursor-pointer select-none items-center gap-2",
                    "rounded-control px-3 py-2 text-body text-fg coarse:min-h-11",
                    // The keyboard/pointer highlight. A step to surface-raised
                    // is too faint to track with the arrow keys, and an alpha
                    // of the brand navy lands differently light vs dark, so:
                    // an explicit mix, which resolves per ground.
                    "data-[selected=true]:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]",
                    "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                  )}
                >
                  {/* Always in the DOM so labels stay aligned whether or not a
                      row is the chosen one. First child => start side => right
                      under RTL. A tick is not directional; it must not mirror. */}
                  <Check
                    className={cn("h-4 w-4 shrink-0 text-accent-text", !isChosen && "invisible")}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-start">{option.label}</span>
                </Command.Item>
              );
            })}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
