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
    <div className={cn("rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] shadow-sm p-5 md:p-6 space-y-4", className)}>
      {!hideSearch && (
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-gray-500"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearch?.(e.target.value)}
            className="ps-11"
          />
        </div>
      )}

      {children && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">{children}</div>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
          <span className="text-caption font-semibold text-slate-500 dark:text-gray-400">فلاتر مفعّلة:</span>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-white/10 px-3 py-1 text-caption font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              {chip.label}
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ))}
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-caption font-semibold text-rose-600 dark:text-rose-400 hover:underline ms-auto cursor-pointer"
            >
              إلغاء الكل
            </button>
          )}
        </div>
      )}
    </div>
  );
}