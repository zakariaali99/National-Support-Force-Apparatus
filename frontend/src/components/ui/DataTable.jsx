import { Skeleton } from "./Skeleton";
import { cn } from "../../lib/utils";

export function DataTable({ columns, rows, isLoading, emptyMessage = "لا توجد بيانات مسجلة" }) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-foreground border-b border-border/60">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={cn("px-4 py-3.5 text-start font-bold text-xs uppercase tracking-wider text-muted-foreground", col.className)}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5">
                    <Skeleton className="h-4 w-4/5 rounded-md" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-12 text-center shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm scrollbar-thin">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-secondary/60 border-b border-border/80 text-foreground sticky top-0 backdrop-blur-md">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3.5 text-start font-bold text-xs text-muted-foreground tracking-wider uppercase whitespace-nowrap",
                  col.align === "center" && "text-center",
                  col.align === "end" && "text-end",
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 bg-card">
          {rows.map((row, rIdx) => (
            <tr
              key={row.id || rIdx}
              className="hover:bg-secondary/40 transition-colors group"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-3.5 align-middle text-foreground font-medium whitespace-nowrap",
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
      </table>
    </div>
  );
}
