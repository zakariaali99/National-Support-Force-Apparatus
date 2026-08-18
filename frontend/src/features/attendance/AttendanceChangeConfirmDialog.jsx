import React from "react";
import { AlertTriangle, CheckCircle2, ArrowLeft, Clock, FileText, UserCheck, ShieldAlert, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

const STATUS_LABELS = {
  present: { label: "حاضر", variant: "success" },
  late: { label: "متأخر", variant: "warning" },
  early_departure: { label: "انصراف مبكر", variant: "warning" },
  excused_absence: { label: "غياب بإذن", variant: "info" },
  unexcused_absence: { label: "غياب بدون إذن", variant: "danger" },
  shift_off: { label: "راحة نوبة", variant: "secondary" },
  vacation: { label: "إجازة رسمية", variant: "purple" },
  mission: { label: "مأمورية", variant: "primary" },
};

export function AttendanceChangeConfirmDialog({
  open,
  onOpenChange,
  date,
  changedRows = [],
  originalMap = new Map(),
  onConfirm,
  isProcessing = false,
}) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 rounded-[28px] border border-amber-200/80 dark:border-amber-900/40 overflow-hidden bg-white dark:bg-[#1A2038] shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-amber-100 dark:border-amber-950/30 bg-amber-50/50 dark:bg-amber-950/20 text-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/40 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-title font-bold text-amber-950 dark:text-amber-200">
                تأكيد حفظ التعديلات فقط على كشف التمام
              </DialogTitle>
              <DialogDescription className="text-caption text-amber-800/80 dark:text-amber-300/80 font-medium">
                كشف يوم ({date}) معتمد مسبقاً. سيتم حفظ وتحديث الأفراد الذين تم تعديلهم فقط ({changedRows.length} فرد).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Changed summary counter badge */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between text-body-sm font-bold text-amber-900 dark:text-amber-200">
            <span>عدد الأفراد الذين طرأ عليهم تعديل:</span>
            <span className="font-mono bg-amber-200/80 dark:bg-amber-800/60 px-3 py-0.5 rounded-xl text-amber-950 dark:text-amber-100">
              {changedRows.length} فرد
            </span>
          </div>

          {/* Table of Changed Rows Only */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
            <table className="w-full text-right text-caption border-collapse">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-gray-300 font-bold">
                <tr>
                  <th className="p-3 text-start">الفرد والرتبة</th>
                  <th className="p-3 text-start">الفصيل</th>
                  <th className="p-3 text-center">الحالة السابقة ⬅️ الجديدة</th>
                  <th className="p-3 text-start">تفاصيل الفروقات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {changedRows.map((r) => {
                  const orig = originalMap.get(r.member_id) || {};
                  const origStatus = orig.status || (orig.expected_duty === "duty" ? "present" : "shift_off");
                  const origInfo = STATUS_LABELS[origStatus] || { label: origStatus, variant: "outline" };
                  const newInfo = STATUS_LABELS[r.status] || { label: r.status, variant: "outline" };

                  const changes = [];
                  if (origStatus !== r.status) {
                    changes.push(`الحالة: ${origInfo.label} ⬅️ ${newInfo.label}`);
                  }
                  if ((parseFloat(orig.late_hours) || 0) !== (parseFloat(r.late_hours) || 0)) {
                    changes.push(`تأخير: ${orig.late_hours || 0}س ⬅️ ${r.late_hours || 0}س`);
                  }
                  if ((parseFloat(orig.excused_hours) || 0) !== (parseFloat(r.excused_hours) || 0)) {
                    changes.push(`إذن: ${orig.excused_hours || 0}س ⬅️ ${r.excused_hours || 0}س`);
                  }
                  if ((orig.notes || "") !== (r.notes || "")) {
                    changes.push(`ملاحظة: ${r.notes || "—"}`);
                  }

                  return (
                    <tr key={r.member_id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                      <td className="p-3 align-middle">
                        <div className="font-bold text-slate-900 dark:text-white text-body-sm">
                          {r.member_name}
                        </div>
                        <div className="text-slate-500 dark:text-gray-400 font-mono text-micro">
                          {r.rank_name} • {r.force_number || "—"}
                        </div>
                      </td>

                      <td className="p-3 align-middle text-slate-700 dark:text-slate-300">
                        {r.faction_name || "—"}
                      </td>

                      <td className="p-3 align-middle text-center">
                        <div className="flex items-center justify-center gap-1.5 font-bold">
                          <span className="text-slate-500 line-through text-micro font-medium">
                            {origInfo.label}
                          </span>
                          <ArrowLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <Badge variant={newInfo.variant} className="font-bold">
                            {newInfo.label}
                          </Badge>
                        </div>
                      </td>

                      <td className="p-3 align-middle text-slate-600 dark:text-gray-300 text-micro">
                        <div className="space-y-0.5">
                          {changes.map((c, i) => (
                            <p key={i} className="font-medium">
                              • {c}
                            </p>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-5 font-bold"
            disabled={isProcessing}
          >
            إلغاء التراجع
          </Button>

          <Button
            variant="primary"
            onClick={onConfirm}
            className="rounded-xl px-6 font-bold gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            disabled={isProcessing || changedRows.length === 0}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>تأكيد وحفظ التعديلات فقط ({changedRows.length} فرد)</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AttendanceChangeConfirmDialog;
