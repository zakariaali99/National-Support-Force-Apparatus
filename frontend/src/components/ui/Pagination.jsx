import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./Button";
import { Select } from "./Select";
import { formatNumber } from "../../lib/format";

export function Pagination({
  page = 1,
  pageSize = 10,
  totalCount = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = "",
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(totalCount, page * pageSize);

  // Generate pagination items array with ellipsis for clean UI
  function getPaginationItems() {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items = [];
    items.push(1);

    if (page > 3) {
      items.push("dots-1");
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      if (!items.includes(i)) {
        items.push(i);
      }
    }

    if (page < totalPages - 2) {
      items.push("dots-2");
    }

    if (!items.includes(totalPages)) {
      items.push(totalPages);
    }

    return items;
  }

  if (totalCount === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-[24px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] text-foreground shadow-sm ${className}`}
    >
      {/* Total records & Page size selector */}
      <div className="flex flex-wrap items-center gap-3 text-caption font-medium text-slate-500 dark:text-gray-400">
        <div className="bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl px-3 py-1.5">
          <span>
            عرض <span className="font-bold text-slate-900 dark:text-white">{formatNumber(startItem)}</span> إلى{" "}
            <span className="font-bold text-slate-900 dark:text-white">{formatNumber(endItem)}</span> من إجمالي{" "}
            <span className="font-bold text-[#2B95E8]">{formatNumber(totalCount)}</span> سجل
          </span>
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-caption font-semibold">العناصر / الصفحة:</span>
            <Select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 py-0 px-2.5 text-caption rounded-xl border-border/80 bg-card font-bold"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {formatNumber(opt)}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Navigation Buttons & Page Number Pills (RTL layout) */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button (RTL: ChevronRight points back) */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 rounded-xl text-caption font-bold"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronRight className="ms-1 h-4 w-4" />
          السابق
        </Button>

        {/* Page Number Pills */}
        <div className="flex items-center gap-1">
          {getPaginationItems().map((item, idx) => {
            if (typeof item === "string") {
              return (
                <span key={item + idx} className="px-1 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              );
            }

            const isCurrent = item === page;
            return (
              <Button
                key={item}
                variant={isCurrent ? "default" : "ghost"}
                size="sm"
                className={`h-9 min-w-9 px-2.5 text-caption font-bold rounded-xl transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-foreground hover:bg-secondary/80"
                }`}
                onClick={() => onPageChange(item)}
              >
                {formatNumber(item)}
              </Button>
            );
          })}
        </div>

        {/* Next Button (RTL: ChevronLeft points forward) */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 rounded-xl text-caption font-bold"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          التالي
          <ChevronLeft className="me-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
