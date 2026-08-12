import { Search, X } from "lucide-react";

import { Input } from "./Input";
import { cn } from "../../lib/utils";

/** Search + filter panel used above data lists. Replaces MemberList's
 *  hand-built filter card and its bare count-badge.
 *
 *  - `search` / `onSearch`  drive the search input.
 *  - `children`             are the filter controls (Combobox/Select/…),
 *                           laid out in a responsive grid.
 *  - `chips`                an optional list of active filters rendered as
 *                           removable chips: [{ key, label, onRemove }].
 */
export function FilterBar({
  search,
  onSearch,
  searchPlaceholder = "بحث...",
  hideSearch = false,
  children,
  chips = [],
  onClearAll,
  className,
}) {
  return (
    <div className={cn("rounded-card border border-border bg-surface shadow-raised", className)}>
      <div className="p-4 space-y-4">
        {!hideSearch && (
          <div className="relative">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearch?.(e.target.value)}
              className="ps-9"
            />
          </div>
        )}

        {children && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
        )}

        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-caption font-semibold text-fg-subtle">فلاتر مفعّلة:</span>
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onRemove}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface-raised px-3 py-1 text-caption font-semibold text-fg hover:bg-danger-surface hover:border-danger-border hover:text-danger transition-colors"
              >
                {chip.label}
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ))}
            {onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-caption font-bold text-primary hover:text-accent-text transition-colors"
              >
                مسح الكل
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}