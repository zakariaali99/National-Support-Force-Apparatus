import { useState } from "react";
import { Command } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { normalizeAr } from "../../lib/arabic";
import { cn } from "../../lib/utils";

/** Searchable single-select, replacing the native <Select> for the
 * rank/faction pickers (which grow past the point where a native dropdown
 * is usable).
 *
 * Controlled: pass `value` + `onChange`. With react-hook-form use a
 * <Controller>, not register() — this renders no native <select> for RHF to
 * bind to.
 *
 * `options`: [{ value, label }]. `value` is compared as a STRING, since it
 * usually originates as a numeric FK id from the API but arrives back from
 * a form as text.
 */
export function Combobox({
  options = [],
  value,
  onChange,
  placeholder = "اختر...",
  searchPlaceholder = "بحث...",
  emptyText = "لا توجد نتائج",
  disabled = false,
  id,
  className,
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => String(o.value) === String(value ?? ""));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-control border border-input bg-card px-3 py-2",
            "text-body text-foreground outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        // Keep focus moving into the search field rather than the trigger.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command
          // cmdk's default filter is a fuzzy Latin matcher; swap in the same
          // Arabic normalization the server searches with, so "احمد" matches
          // an option labelled "أحمد" instead of showing "no results".
          filter={(itemValue, search) => {
            const haystack = normalizeAr(itemValue);
            const needle = normalizeAr(search);
            return !needle || haystack.includes(needle) ? 1 : 0;
          }}
        >
          <div className="border-b border-border/60 px-3">
            <Command.Input
              placeholder={searchPlaceholder}
              className="h-10 w-full bg-transparent text-body text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-60 overflow-y-auto p-1">
            <Command.Empty className="py-6 text-center text-caption text-muted-foreground">
              {emptyText}
            </Command.Empty>
            {options.map((option) => {
              const isSelected = String(option.value) === String(value ?? "");
              return (
                <Command.Item
                  key={option.value}
                  // cmdk passes THIS string to the filter above, so the label
                  // (not the numeric id) is what gets searched.
                  value={option.label}
                  onSelect={() => {
                    onChange?.(String(option.value));
                    setOpen(false);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-control px-3 py-2 text-body outline-none",
                    "data-[selected=true]:bg-secondary"
                  )}
                >
                  <Check
                    className={cn("h-4 w-4 shrink-0", isSelected ? "opacity-100 text-primary" : "opacity-0")}
                    aria-hidden="true"
                  />
                  <span className="truncate">{option.label}</span>
                </Command.Item>
              );
            })}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
