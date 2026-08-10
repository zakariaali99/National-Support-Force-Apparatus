import { Skeleton } from "./Skeleton";

export function DataTable({ columns, rows, isLoading, emptyMessage = "لا توجد بيانات" }) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-secondary-foreground">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-start font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx} className="hover:bg-secondary/50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-5/6" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (!rows.length) {
    return <div className="p-8 text-center text-sm text-muted-foreground">{emptyMessage}</div>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-secondary-foreground">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2.5 text-start font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-secondary/50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2.5">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
