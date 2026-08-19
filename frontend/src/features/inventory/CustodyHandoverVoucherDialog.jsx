import { useState, useRef } from "react";
import { Printer, X, Shield, FileCheck2, Calendar, User, Package, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { showToast } from "../../components/ui/Toast";
import { openAuthedPdf, downloadAuthedFile } from "../reports/api";
import { printCustodyVoucherInNewWindow } from "../../lib/printUtils";
import nasfSeal from "../../assets/brand/nasf-seal.jpg";

export function CustodyHandoverVoucherDialog({ item, custodyRecord, open, onOpenChange, initialAction = "صرف عهدة" }) {
  const [printDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState(() => {
    if (custodyRecord?.action === "returned") return "إرجاع واستلام عهدة";
    if (custodyRecord?.action === "damaged") return "إثبات تلف";
    return initialAction || "صرف عهدة";
  });
  const [notes, setNotes] = useState(() => custodyRecord?.notes || item?.notes || "");
  const voucherNumber = useRef(`VOUCH-${Math.floor(100000 + Math.random() * 900000)}`).current;

  if (!item && !custodyRecord) return null;

  const isReturn = actionType === "إرجاع واستلام عهدة";

  const recipientName = custodyRecord?.member_name || "الفرد المعني بالعهدة";
  const recipientForceNumber = custodyRecord?.force_number || "—";
  const recipientRank = custodyRecord?.rank_name || "عضو بالقوة";
  const recipientFaction = custodyRecord?.faction_name || "الإدارة العامة";

  const itemName = item?.name || custodyRecord?.item_name || "صنف عسكري / مهمات";
  const itemCode = item?.code || custodyRecord?.item_code || "—";
  const itemSerial = item?.serial_number || custodyRecord?.serial_number || "—";
  const itemCategory = item?.category_name || "مهمات وعتاد";
  const quantity = custodyRecord?.quantity || 1;

  const buildParams = () => {
    return new URLSearchParams({
      voucher_number: voucherNumber,
      date: printDate,
      action: actionType,
      recipient_name: recipientName,
      recipient_rank: recipientRank,
      recipient_force_number: recipientForceNumber,
      recipient_faction: recipientFaction,
      item_name: itemName,
      item_category: itemCategory,
      item_code: itemCode,
      item_serial: itemSerial,
      quantity: String(quantity),
      notes: notes || "",
    }).toString();
  };

  const handlePrint = () => {
    printCustodyVoucherInNewWindow({ item, custodyRecord, action: actionType, notes, voucherNumber });
  };

  const handleDownloadPdf = async () => {
    setIsProcessing(true);
    try {
      await downloadAuthedFile(`reports/inventory/custody-voucher/?${buildParams()}`, `محضر_${actionType.replace(/\s+/g, "_")}_${voucherNumber}.pdf`);
      showToast("تم بدء تنزيل محضر العهدة الرسمي", "success");
    } catch {
      showToast("تعذر تنزيل ملف PDF", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-[28px] border border-slate-200/80 dark:border-white/10">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-start">
              <DialogTitle className="text-title font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#2B95E8]" />
                <span>محضر تسليم واستلام عهدة رسمية</span>
              </DialogTitle>
              <DialogDescription className="text-caption">
                وثيقة رسمية معتمدة للطباعة لتسليم واستلام العهد والمهمات
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handlePrint} className="gap-1.5 rounded-xl font-bold">
                <Printer className="w-4 h-4" />
                <span>طباعة المحضر</span>
              </Button>
            </div>
          </div>

          {/* Quick Adjustment Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5">
            <div className="space-y-1 text-start">
              <label className="text-caption font-bold text-slate-700 dark:text-slate-300">نوع الإجراء والمحضر:</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1A2038] text-body-sm font-semibold"
              >
                <option value="صرف عهدة">تسليم وصرف عهدة</option>
                <option value="إرجاع واستلام عهدة">إرجاع واستلام عهدة (إخلاء طرف)</option>
                <option value="إثبات تلف">إثبات تلف / فحص فني</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1 text-start">
              <label className="text-caption font-bold text-slate-700 dark:text-slate-300">
                {isReturn ? "ملاحظات الفحص والاستلام وإخلاء الطرف:" : "ملاحظات وبيان الصرف والتكليف:"}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أدخل أية ملاحظات ترغب في طباعتها على محضر العهدة..."
                className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1A2038] text-body-sm font-semibold"
              />
            </div>
          </div>
        </DialogHeader>

        {/* Printable Voucher Paper */}
        <div className="p-8 bg-white text-slate-900 font-sans print:p-0 print:m-0" id="custody-voucher-print">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
            <div className="text-right space-y-1">
              <p className="font-bold text-body-sm text-slate-900">دولة ليبيا</p>
              <p className="font-bold text-body-sm text-slate-900">الجهاز الوطني للقوى المساندة</p>
              <p className="text-caption text-slate-600">إدارة التسليح والإمداد والعهد</p>
            </div>

            <div className="flex flex-col items-center">
              <img src={nasfSeal} alt="شعار الجهاز" className="w-16 h-16 object-contain rounded-full border border-slate-200 p-0.5" />
              <span className="text-caption font-bold text-slate-700 mt-1">الرقم: {voucherNumber}</span>
            </div>

            <div className="text-left space-y-1 font-mono text-caption">
              <p>التاريخ: {printDate}</p>
              <p>نوع الإجراء: {actionType}</p>
              <p className="font-bold text-emerald-700">حالة السند: معتمد رسمياً</p>
            </div>
          </div>

          <div className="text-center my-4">
            <h2 className="text-title font-bold text-slate-900 underline decoration-2 underline-offset-8">
              {isReturn ? "محضر إرجاع واستلام عهدة وإخلاء طرف رسمي" : "محضر تسليم وصرف عهدة فردية رسمي"}
            </h2>
          </div>

          {/* Recipient Details Card */}
          <div className="my-6 p-4 rounded-2xl border border-slate-300 bg-slate-50/70 space-y-3">
            <h4 className="font-bold text-body-sm text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <User className="w-4 h-4 text-[#2B95E8]" />
              <span>أولاً: بيانات الفرد {isReturn ? "(المُسلِّم / المُخلى طرفه)" : "(المكلف بالعهدة)"}</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-caption">
              <div>
                <span className="text-slate-500 block">اسم الفرد:</span>
                <span className="font-bold text-slate-900 text-body-sm">{recipientName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">الرتبة العسكرية:</span>
                <span className="font-bold text-slate-900">{recipientRank}</span>
              </div>
              <div>
                <span className="text-slate-500 block">الرقم العسكري:</span>
                <span className="font-bold text-slate-900 font-mono">{recipientForceNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">الفصيل / التبعية:</span>
                <span className="font-bold text-slate-900">{recipientFaction}</span>
              </div>
            </div>
          </div>

          {/* Item Details Table */}
          <div className="my-6 space-y-3">
            <h4 className="font-bold text-body-sm text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#2B95E8]" />
              <span>ثانياً: تفاصيل الأصناف والمهمات {isReturn ? "المسترجعة" : "المسلمة"}</span>
            </h4>
            <table className="w-full text-right text-caption border-collapse border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300 text-slate-800">
                <tr>
                  <th className="p-2.5 border border-slate-300">ت</th>
                  <th className="p-2.5 border border-slate-300">اسم الصنف والمواصفات</th>
                  <th className="p-2.5 border border-slate-300">التصنيف</th>
                  <th className="p-2.5 border border-slate-300">كود الصنف</th>
                  <th className="p-2.5 border border-slate-300">الرقم التسلسلي (Serial)</th>
                  <th className="p-2.5 border border-slate-300 text-center">الكمية</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2.5 border border-slate-300 text-center font-mono">1</td>
                  <td className="p-2.5 border border-slate-300 font-bold">{itemName}</td>
                  <td className="p-2.5 border border-slate-300">{itemCategory}</td>
                  <td className="p-2.5 border border-slate-300 font-mono">{itemCode}</td>
                  <td className="p-2.5 border border-slate-300 font-mono font-bold text-blue-900">{itemSerial}</td>
                  <td className="p-2.5 border border-slate-300 text-center font-bold font-mono">{quantity}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes & Special Directives Block */}
          {notes && (
            <div className="my-6 p-4 rounded-xl border border-slate-300 bg-slate-50/70 text-caption text-slate-800 space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>{isReturn ? "ملاحظات الفحص والاستلام:" : "ملاحظات وتوجيهات التكليف والصرف:"}</span>
              </p>
              <p className="leading-relaxed text-slate-700">{notes}</p>
            </div>
          )}

          {/* Legal Acknowledgement */}
          <div className="my-6 p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-caption text-slate-700 leading-relaxed">
            <p className="font-bold text-slate-900 mb-1">
              {isReturn ? "إقرار الفحص وإخلاء الطرف:" : "إقرار وتعهد بالمسؤولية:"}
            </p>
            <p>
              {isReturn
                ? "أقر أنا أمين العهدة والمستودع باستلامي للأصناف والمهمات الموضحة بياناتها أعلاه بحالتها الفنية المبينة، وإخلاء طرف الفرد المذكور من عهدتها الرسمية بعد المطابقة والمعاينة."
                : "أقر أنا الموقع أدناه باستلامي للأصناف والمهمات الموضحة بياناتها أعلاه بحالة جيدة وسليمة، وأتعهد بالمحافظة عليها واستخدامها في الأغراض الرسمية المخصصة لها فقط، وإعادتها فور انتهاء التكليف أو طلب الإدارة، مع تحملي المسؤولية القانونية والإدارية الكاملة في حال الفقد أو الإتلاف الناتج عن الإهمال."}
            </p>
          </div>

          {/* Signatures Grid */}
          <div className="grid grid-cols-3 gap-6 pt-6 mt-8 border-t border-slate-300 text-caption text-center">
            <div className="space-y-12">
              <p className="font-bold text-slate-800">{isReturn ? "توقيع الفرد (المُسلِّم)" : "توقيع المستلم"}</p>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto" />
              <p className="text-caption text-slate-500">الاسم: {recipientName}</p>
            </div>

            <div className="space-y-12">
              <p className="font-bold text-slate-800">أمين المستودع / التسليح</p>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto" />
              <p className="text-caption text-slate-500">التوقيع والختم</p>
            </div>

            <div className="space-y-12">
              <p className="font-bold text-slate-800">اعتماد آمر الوحدة / الإدارة</p>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto" />
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
              <span>تحميل مستند PDF رسمي</span>
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

export default CustodyHandoverVoucherDialog;
