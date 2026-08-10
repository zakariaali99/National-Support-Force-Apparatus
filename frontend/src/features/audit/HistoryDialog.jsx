import { History } from "lucide-react";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/Dialog";
import { formatDateTime } from "../../lib/format";
import { useHistory } from "./api";

const TYPE_LABELS = { "+": "إنشاء", "~": "تعديل", "-": "حذف" };
const TYPE_VARIANTS = { "+": "success", "~": "info", "-": "destructive" };

export function HistoryDialog({ model, id }) {
  const { data: entries = [], isLoading } = useHistory(model, id);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="shadow-sm">
          <History className="h-4 w-4 shrink-0" />
          <span>السجل</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[min(92vw,36rem)]">
        <DialogHeader>
          <DialogTitle>سجل التعديلات</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pe-1">
          {isLoading && <p className="text-xs text-muted-foreground text-center py-4">جارِ التحميل...</p>}
          {!isLoading && entries.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">لا يوجد سجل تعديلات.</p>
          )}
          {entries.map((entry, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-border/50 bg-card/40">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={TYPE_VARIANTS[entry.history_type] || "outline"}>
                  {TYPE_LABELS[entry.history_type] || entry.history_type}
                </Badge>
                <span className="text-xs font-bold text-foreground">{entry.history_user || "النظام"}</span>
                <span className="text-[10px] text-muted-foreground"><bdi dir="ltr">{formatDateTime(entry.history_date)}</bdi></span>
              </div>
              {entry.changes.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {entry.changes.map((c, cIdx) => (
                    <li key={cIdx} className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{c.field}</span>: من{" "}
                      <bdi dir="ltr">{c.old || "—"}</bdi> إلى <bdi dir="ltr">{c.new || "—"}</bdi>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
