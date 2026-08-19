import { Fragment, useMemo, useState } from "react";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

import { Skeleton } from "./Skeleton";
import { cn } from "../../lib/utils";

function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "ar");
}

/**
 * @param {object}   props
 * @param {Array<{key,label,render?,align?,sortable?,className?,cellClassName?}>} props.columns
 * @param {Array<object>} props.rows
 * @param {boolean}  [props.sortable]       Enables header sorting. Sorts
 *                                          client-side unless `onSortChange`
 *                                          is provided, in which case the
 *                                          parent owns sorting (server-side)
 *                                          and must re-pass sorted rows.
 * @param {object}   [props.initialSort]    { key, dir: 'asc'|'desc' }
 * @param {(sort) => void} [props.onSortChange]
 * @param {(row: object) => ReactNode} [props.rowCard]
 *        When given, rows render as cards on <640px screens instead of a
 *        horizontally-scrolling table.
 */
export function DataTable({
  columns = [],
  rows,
  data,
  isLoading,
  loading,
  emptyMessage = "لا توجد بيانات مسجلة",
  sortable = false,
  initialSort,
  onSortChange,
  rowCard,
}) {
  const actualRows = rows || data || [];
  const actualLoading = isLoading ?? loading ?? false;

  const normalizedColumns = useMemo(() => {
    return columns.map((col) => ({
      key: col.key || col.id || col.accessor || "",
      label: col.label || col.header || "",
      render: col.render || col.cell || ((r) => r?.[col.key || col.id || col.accessor]),
      align: col.align,
      sortable: col.sortable,
      sortAccessor: col.sortAccessor,
      className: col.className,
      cellClassName: col.cellClassName,
    }));
  }, [columns]);

  const hasMobileCards = typeof rowCard === "function";
  const [sortState, setSortState] = useState(() => initialSort ?? null);

  const sortedRows = useMemo(() => {
    if (!sortable || onSortChange || !sortState) return actualRows;
    const col = normalizedColumns.find((c) => c.key === sortState.key);
    const accessor = col && typeof col.sortAccessor === "function" ? col.sortAccessor : (r) => r?.[sortState.key];
    const dir = sortState.dir === "desc" ? -1 : 1;
    return [...actualRows].sort((a, b) => compareValues(accessor(a), accessor(b)) * dir);
  }, [actualRows, sortable, onSortChange, sortState, normalizedColumns]);

  function handleSort(col) {
    if (!sortable || col.sortable === false) return;
    let next;
    if (!sortState || sortState.key !== col.key) next = { key: col.key, dir: "asc" };
    else next = { key: col.key, dir: sortState.dir === "asc" ? "desc" : "asc" };
    if (onSortChange) {
      onSortChange(next);
      return;
    }
    setSortState(next);
  }

  function SortGlyph({ col }) {
    if (!sortable || col.sortable === false) return null;
    const active = sortState?.key === col.key;
    if (!active) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />;
    return sortState.dir === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5 text-accent-indicator" aria-hidden="true" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-accent-indicator" aria-hidden="true" />
    );
  }

  const head = (compact = false) => (
    <thead
      className={cn(
        "bg-slate-50/90 dark:bg-white/5 text-slate-500 font-bold border-b border-slate-200/80 dark:border-white/10 text-caption uppercase",
        compact && "bg-surface"
      )}
    >
      <tr>
        {normalizedColumns.map((col) => (
          <th
                     className={cn(
              "px-3.5 py-2.5 text-start font-bold text-caption text-slate-500 dark:text-gray-400 tracking-wide",
              col.align === "center" && "text-center",
              col.align === "end" && "text-end",
              sortable && col.sortable !== false && "cursor-pointer select-none",
              col.className
            )}
            onClick={() => handleSort(col)}
            aria-sort={
              sortState?.key === col.key
                ? sortState.dir === "asc"
                  ? "ascending"
                  : "descending"
                : undefined
            }
          >
            <span className="inline-flex items-center gap-1.5">
              {col.label}
              <SortGlyph col={col} />
            </span>
          </th>
        ))}
      </tr>
    </thead>
  );

  const body = (rowsToRender) => (
    <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-[#1A2038]">
      {rowsToRender.map((row, rIdx) => (
        <tr key={row.id || rIdx} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
          {normalizedColumns.map((col) => (
            <td
              key={col.key}
              className={cn(
                "px-3.5 py-2.5 align-middle text-slate-800 dark:text-slate-200 font-medium text-body-sm",
                col.align === "center" && "text-center",
                col.align === "end" && "text-end",
                col.cellClassName
              )}
            >
              {col.render ? col.render(row) : row[col.key] ?? "—"}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  const skeletonBody = (targetColumns = normalizedColumns) => (
    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
      {Array.from({ length: 5 }).map((_, rIdx) => (
        <tr key={rIdx}>
          {targetColumns.map((col) => (
            <td key={col.key} className="px-3.5 py-2.5">
              <Skeleton className="h-4 w-4/5 rounded-md" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  if (actualLoading) {
    return (
      <div className="overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] shadow-sm">
        <table className="w-full text-body-sm">
          {head(true)}
          {skeletonBody()}
        </table>
      </div>
    );
  }

  if (!actualRows || actualRows.length === 0) {
    return (
      <div className="rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] p-12 text-center shadow-sm">
        <p className="text-body-sm font-medium text-slate-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  if (hasMobileCards) {
    return (
      <>
        <div className="md:hidden space-y-3">
          {sortedRows.map((row, rIdx) => (
            <Fragment key={row.id || rIdx}>{rowCard(row)}</Fragment>
          ))}
        </div>
        <div className="hidden md:block rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] shadow-sm overflow-hidden">
          <table className="w-full text-body-sm border-collapse table-auto">
            {head()}
            {body(sortedRows)}
          </table>
        </div>
      </>
    );
  }

  return (
    <div className="rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] shadow-sm overflow-hidden">
      <table className="w-full text-body-sm border-collapse table-auto">
        {head()}
        {body(sortedRows)}
      </table>
    </div>
  );
}