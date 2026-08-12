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
  columns,
  rows = [],
  isLoading,
  emptyMessage = "لا توجد بيانات مسجلة",
  sortable = false,
  initialSort,
  onSortChange,
  rowCard,
}) {
  const hasMobileCards = typeof rowCard === "function";

  const [sortState, setSortState] = useState(() => initialSort ?? null);

  const sortedRows = useMemo(() => {
    if (!sortable || onSortChange || !sortState) return rows;
    const col = columns.find((c) => c.key === sortState.key);
    const accessor = col && typeof col.sortAccessor === "function" ? col.sortAccessor : (r) => r?.[sortState.key];
    const dir = sortState.dir === "desc" ? -1 : 1;
    return [...rows].sort((a, b) => compareValues(accessor(a), accessor(b)) * dir);
  }, [rows, sortable, onSortChange, sortState, columns]);

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
        "bg-surface-raised text-fg border-b border-border",
        compact && "bg-surface"
      )}
    >
      <tr>
        {columns.map((col) => (
          <th
            key={col.key}
            className={cn(
              "px-4 py-3.5 text-start font-bold text-caption text-fg-subtle tracking-wide whitespace-nowrap",
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
    <tbody className="divide-y divide-border bg-surface">
      {rowsToRender.map((row, rIdx) => (
        <tr key={row.id || rIdx} className="hover:bg-surface-raised transition-colors">
          {columns.map((col) => (
            <td
              key={col.key}
              className={cn(
                "px-4 py-3.5 align-middle text-fg font-medium whitespace-nowrap",
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

  const skeletonBody = (targetColumns = columns) => (
    <tbody className="divide-y divide-border/60">
      {Array.from({ length: 5 }).map((_, rIdx) => (
        <tr key={rIdx}>
          {targetColumns.map((col) => (
            <td key={col.key} className="px-4 py-3.5">
              <Skeleton className="h-4 w-4/5 rounded-md" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-raised">
        <table className="w-full text-body-sm">
          {head(true)}
          {skeletonBody()}
        </table>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface p-12 text-center shadow-raised">
        <p className="text-body font-medium text-fg-subtle">{emptyMessage}</p>
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
        <div className="hidden md:block overflow-x-auto rounded-card border border-border bg-surface shadow-raised scrollbar-thin">
          <table className="w-full text-body-sm border-collapse">
            {head()}
            {body(sortedRows)}
          </table>
        </div>
      </>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-raised scrollbar-thin">
      <table className="w-full text-body-sm border-collapse">
        {head()}
        {body(sortedRows)}
      </table>
    </div>
  );
}