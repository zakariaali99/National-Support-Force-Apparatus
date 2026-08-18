import React, { useState, useEffect } from "react";
import { Clock, Calendar, User, FileText, AlertTriangle, ShieldCheck, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Textarea } from "../../components/ui/Textarea";
import { Badge } from "../../components/ui/Badge";

export function AttendanceDetailsDialog({ row, open, onOpenChange, onSave }) {
  const [formData, setFormData] = useState({
    check_in_time: "",
    check_out_time: "",
    late_hours: 0,
    early_departure_hours: 0,
    excused_hours: 0,
    notes: "",
  });

  useEffect(() => {
    if (row) {
      setFormData({
        check_in_time: row.check_in_time || "",
        check_out_time: row.check_out_time || "",
        late_hours: row.late_hours || 0,
        early_departure_hours: row.early_departure_hours || 0,
        excused_hours: row.excused_hours || 0,
        notes: row.notes || "",
      });
    }
  }, [row]);

  if (!row) return null;

  const excusedNum = parseFloat(formData.excused_hours) || 0;
  const calculatedDeduction =
    row.status === "excused_absence"
      ? excusedNum > 0
        ? (excusedNum / 8.0).toFixed(2)
        : "1.00"
      : "0.00";

  const handleSave = () => {
    onSave(row.member_id, formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 rounded-[28px] border border-slate-200/80 dark:border-white/10 overflow-hidden bg-white dark:bg-[#1A2038]">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-start justify-between">
            <div className="space-y-1 text-start">
              <DialogTitle className="text-title font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#2B95E8]" />
                <span>تفاصيل التمام والانضباط</span>
              </DialogTitle>
              <DialogDescription className="text-caption text-slate-500 dark:text-gray-400">
                تسجيل الساعات الدقيقة، أذونات الغياب، وملاحظات الفرد
              </DialogDescription>
            </div>
            <Badge variant="navy" className="font-mono">
              {row.force_number || "—"}
            </Badge>
          </div>

          {/* Member Info Strip */}
          <div className="mt-3 p-3 rounded-2xl bg-blue-50/60 dark:bg-white/5 border border-blue-100/80 dark:border-white/10 flex items-center justify-between text-start">
            <div>
              <div className="font-bold text-body-sm text-slate-900 dark:text-white">{row.member_name}</div>
              <div className="text-caption text-slate-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                <span>{row.rank_name || "عضو بالقوة"}</span>
                <span>•</span>
                <span>{row.faction_name || "عام"}</span>
              </div>
            </div>
            <Badge variant="gold" className="text-caption font-bold">
              {row.shift_group_name || "دوام إداري"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Time Tracking Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-start">
              <Label className="text-caption font-bold text-slate-700 dark:text-gray-300">وقت الحضور الفعلي</Label>
              <Input
                type="time"
                value={formData.check_in_time}
                onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                className="h-11 rounded-2xl font-mono text-center text-body-sm"
              />
            </div>
            <div className="space-y-1.5 text-start">
              <Label className="text-caption font-bold text-slate-700 dark:text-gray-300">وقت الانصراف الفعلي</Label>
              <Input
                type="time"
                value={formData.check_out_time}
                onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                className="h-11 rounded-2xl font-mono text-center text-body-sm"
              />
            </div>
          </div>

          {/* Hours Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 text-start">
              <Label className="text-caption font-bold text-amber-600 dark:text-amber-400">التأخير (ساعات)</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.late_hours}
                onChange={(e) => setFormData({ ...formData, late_hours: parseFloat(e.target.value) || 0 })}
                className="h-11 rounded-2xl font-mono text-center text-body-sm"
                placeholder="0"
              />
            </div>

            <div className="space-y-1.5 text-start">
              <Label className="text-caption font-bold text-amber-600 dark:text-amber-400">انصراف مبكر</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.early_departure_hours}
                onChange={(e) =>
                  setFormData({ ...formData, early_departure_hours: parseFloat(e.target.value) || 0 })
                }
                className="h-11 rounded-2xl font-mono text-center text-body-sm"
                placeholder="0"
              />
            </div>

            <div className="space-y-1.5 text-start">
              <Label className="text-caption font-bold text-blue-600 dark:text-blue-400">استئذان / إذن</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.excused_hours}
                onChange={(e) => setFormData({ ...formData, excused_hours: parseFloat(e.target.value) || 0 })}
                className="h-11 rounded-2xl font-mono text-center text-body-sm"
                placeholder="0"
              />
            </div>
          </div>

          {/* Vacation Deduction notice if excused */}
          {parseFloat(calculatedDeduction) > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 flex items-center justify-between text-start">
              <div className="flex items-center gap-2 text-caption text-amber-800 dark:text-amber-300 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>الخصم الإداري المحسوب من رصيد الإجازات:</span>
              </div>
              <span className="font-bold font-mono text-amber-900 dark:text-amber-200">
                -{calculatedDeduction} يوم
              </span>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5 text-start">
            <Label className="text-caption font-bold text-slate-700 dark:text-gray-300">ملاحظات وسبب التأخير أو الإذن</Label>
            <Textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="اكتب تفاصيل الإذن، رقم المأمورية، أو أسباب التأخير إن وجدت..."
              className="rounded-2xl text-body-sm"
            />
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            إلغاء
          </Button>
          <Button variant="primary" onClick={handleSave} className="gap-2 rounded-xl font-bold">
            <Check className="w-4 h-4" />
            <span>حفظ التفاصيل</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AttendanceDetailsDialog;
