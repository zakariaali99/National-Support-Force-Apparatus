import { useState, useRef } from "react";
import { Printer, Calendar, Users, ShieldCheck, CheckCheck, FileCheck2, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { showToast } from "../../components/ui/Toast";
import { openAuthedPdf, downloadAuthedFile } from "../reports/api";
import nasfSeal from "../../assets/brand/nasf-seal.jpg";

export function DailyAttendancePrintDialog({ rows = [], date, factionId, factionName, open, onOpenChange }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const reportNumber = useRef(`ATT-${Math.floor(100000 + Math.random() * 900000)}`).current;

  const buildParams = () => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (factionId && factionId !== "all") params.set("faction", factionId);
    return params.toString();
  };

  const handlePrint = async () => {
    setIsProcessing(true);
    try {
      const q = buildParams();
      await openAuthedPdf(`reports/attendance/daily/pdf/${q ? `?${q}` : ""}`);
    } catch {
      showToast("تعذر فتح كشف التمام في تبويب جديد", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsProcessing(true);
    try {
      const q = buildParams();
      await downloadAuthedFile(
        `reports/attendance/daily/pdf/${q ? `?${q}` : ""}`,
        `كشف_التمام_اليومي_${date || "عام"}.pdf`
      );
      showToast("تم بدء تنزيل كشف التمام الرسمي", "success");
    } catch {
      showToast("تعذر تنزيل كشف التمام", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const total = rows.length;
  const present = rows.filter((r) => r.status === "present").length;
  const late = rows.filter((r) => r.status === "late" || parseFloat(r.late_hours) > 0).length;
  const excused = rows.filter((r) => r.status === "excused_absence" || parseFloat(r.excused_hours) > 0).length;
  const unexcused = rows.filter((r) => r.status === "unexcused_absence").length;
  const shiftOff = rows.filter((r) => r.status === "shift_off").length;
  const vacation = rows.filter((r) => r.status === "vacation").length;
  const mission = rows.filter((r) => r.status === "mission").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-[28px] border border-slate-200/80 dark:border-white/10">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-start">
              <DialogTitle className="text-title font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#2B95E8]" />
                <span>كشف التمام والانضباط العسكري اليومي</span>
              </DialogTitle>
              <DialogDescription className="text-caption">
                تقرير رسمي معتمد للطباعة لرفعه لقيادة الجهاز وآمر القوة
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handlePrint} className="gap-1.5 rounded-xl font-bold">
                <Printer className="w-4 h-4" />
                <span>طباعة الكشف</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Printable Attendance Sheet Paper */}
        <div className="p-8 bg-white text-slate-900 font-sans print:p-0 print:m-0" id="daily-attendance-print">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
            <div className="text-right space-y-1">
              <p className="font-bold text-body-sm text-slate-900">دولة ليبيا</p>
              <p className="font-bold text-body-sm text-slate-900">الجهاز الوطني للقوى المساندة</p>
              <p className="text-caption text-slate-600">شعبة العمليات والتمام العسكري</p>
            </div>

            <div className="flex flex-col items-center">
              <img src={nasfSeal} alt="شعار الجهاز" className="w-16 h-16 object-contain rounded-full border border-slate-200 p-0.5" />
              <span className="text-caption font-bold text-slate-700 mt-1">كشف رقم: {reportNumber}</span>
            </div>

            <div className="text-left space-y-1 font-mono text-caption">
              <p>التاريخ: {date}</p>
              <p>الفصيل: {factionName || "كافة الفصائل"}</p>
              <p className="font-bold text-emerald-700">الحالة: معتمد للعمليات</p>
            </div>
          </div>

          <div className="text-center my-4">
            <h2 className="text-title font-bold text-slate-900 underline decoration-2 underline-offset-8">
              كشف التمام اليومي العام للقوة
            </h2>
          </div>

          {/* Statistical Summary Box */}
          <div className="my-6 p-4 rounded-2xl border border-slate-300 bg-slate-50/70">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center text-caption font-mono">
              <div className="p-2 border border-slate-200 bg-white rounded-xl">
                <span className="text-slate-500 block text-caption font-sans">إجمالي القوة</span>
                <span className="font-bold text-body-sm text-slate-900">{total}</span>
              </div>
              <div className="p-2 border border-slate-200 bg-emerald-50 rounded-xl text-emerald-800">
                <span className="block text-caption font-sans">حاضر</span>
                <span className="font-bold text-body-sm">{present}</span>
              </div>
              <div className="p-2 border border-slate-200 bg-amber-50 rounded-xl text-amber-800">
                <span className="block text-caption font-sans">تأخير</span>
                <span className="font-bold text-body-sm">{late}</span>
              </div>
              <div className="p-2 border border-slate-200 bg-blue-50 rounded-xl text-blue-800">
                <span className="block text-caption font-sans">مأذون</span>
                <span className="font-bold text-body-sm">{excused}</span>
              </div>
              <div className="p-2 border border-slate-200 bg-rose-50 rounded-xl text-rose-800">
                <span className="block text-caption font-sans">غياب</span>
                <span className="font-bold text-body-sm">{unexcused}</span>
              </div>
              <div className="p-2 border border-slate-200 bg-slate-100 rounded-xl text-slate-700">
                <span className="block text-caption font-sans">راحة نوبة</span>
                <span className="font-bold text-body-sm">{shiftOff}</span>
              </div>
              <div className="p-2 border border-slate-200 bg-purple-50 rounded-xl text-purple-800">
                <span className="block text-caption font-sans">إجازة</span>
                <span className="font-bold text-body-sm">{vacation}</span>
              </div>
              <div className="p-2 border border-slate-200 bg-indigo-50 rounded-xl text-indigo-800">
                <span className="block text-caption font-sans">مأمورية</span>
                <span className="font-bold text-body-sm">{mission}</span>
              </div>
            </div>
          </div>

          {/* Members Attendance Table */}
          <div className="my-6 space-y-2">
            <table className="w-full text-right text-caption border-collapse border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300 text-slate-800 text-caption">
                <tr>
                  <th className="p-2 border border-slate-300 text-center">ت</th>
                  <th className="p-2 border border-slate-300">الرقم العسكري</th>
                  <th className="p-2 border border-slate-300">الرتبة والاسم الكامل</th>
                  <th className="p-2 border border-slate-300">الفصيل / النوبة</th>
                  <th className="p-2 border border-slate-300 text-center">حالة التمام</th>
                  <th className="p-2 border border-slate-300 text-center">التأخير (ساعة)</th>
                  <th className="p-2 border border-slate-300 text-center">الاستئذان (ساعة)</th>
                  <th className="p-2 border border-slate-300">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-body-sm">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-slate-500">
                      لا يوجد أفراد مسجلون لهذا اليوم.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.member_id || idx} className="hover:bg-slate-50">
                      <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-mono font-bold">{row.force_number || "—"}</td>
                      <td className="p-2 border border-slate-300 font-bold">
                        {row.rank_name} / {row.member_name}
                      </td>
                      <td className="p-2 border border-slate-300">{row.faction_name} ({row.shift_group_name || "—"})</td>
                      <td className="p-2 border border-slate-300 text-center font-bold">
                        {row.status === "present" && <span className="text-emerald-700">حاضر</span>}
                        {row.status === "late" && <span className="text-amber-700">متأخر</span>}
                        {row.status === "excused_absence" && <span className="text-blue-700">غياب بإذن</span>}
                        {row.status === "unexcused_absence" && <span className="text-rose-700">غياب بدون إذن</span>}
                        {row.status === "shift_off" && <span className="text-slate-500">راحة نوبة</span>}
                        {row.status === "vacation" && <span className="text-purple-700">إجازة رسمية</span>}
                        {row.status === "mission" && <span className="text-indigo-700">مأمورية</span>}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono">
                        {parseFloat(row.late_hours) > 0 ? `${row.late_hours}س` : "—"}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono">
                        {parseFloat(row.excused_hours) > 0 ? `${row.excused_hours}س` : "—"}
                      </td>
                      <td className="p-2 border border-slate-300 text-slate-600">{row.notes || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Commander Signatures */}
          <div className="grid grid-cols-2 gap-12 pt-8 mt-8 border-t border-slate-300 text-caption text-center">
            <div className="space-y-12">
              <p className="font-bold text-slate-800">ضابط التمام والمتابعة</p>
              <div className="border-b border-dashed border-slate-400 w-1/2 mx-auto" />
              <p className="text-caption text-slate-500">التوقيع</p>
            </div>

            <div className="space-y-12">
              <p className="font-bold text-slate-800">يعتمد / آمر شعبة العمليات</p>
              <div className="border-b border-dashed border-slate-400 w-1/2 mx-auto" />
              <p className="text-caption text-slate-500">الختم الرسمي</p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            إغلاق
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPdf} className="gap-2 rounded-xl font-bold text-[#2B95E8]">
              <Download className="w-4 h-4" />
              <span>تحميل كشف التمام (PDF)</span>
            </Button>
            <Button variant="primary" onClick={handlePrint} className="gap-2 rounded-xl font-bold">
              <Printer className="w-4 h-4" />
              <span>طباعة فورية</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DailyAttendancePrintDialog;
