import { useState, useRef } from "react";
import { Printer, Car, User, Shield, MapPin, FileCheck2, Calendar, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { showToast } from "../../components/ui/Toast";
import { openAuthedPdf, downloadAuthedFile } from "../reports/api";
import { printVehicleTripVoucherInNewWindow } from "../../lib/printUtils";
import nasfSeal from "../../assets/brand/nasf-seal.jpg";

export function VehicleTripVoucherDialog({ vehicle, open, onOpenChange }) {
  const [printDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [destination, setDestination] = useState(() => vehicle?.destination || "وفق خط السير المعتمد");
  const [purpose, setPurpose] = useState(() => vehicle?.purpose || "مهمة إدارية / عملياتية رسمية");
  const [notes, setNotes] = useState(() => vehicle?.notes || "");
  const [startOdometer, setStartOdometer] = useState(() => vehicle?.odometer_reading ? String(vehicle.odometer_reading) : "0");
  const [returnOdometer, setReturnOdometer] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const tripNumber = useRef(`TRIP-${Math.floor(100000 + Math.random() * 900000)}`).current;

  const handlePrint = () => {
    if (!vehicle) return;
    printVehicleTripVoucherInNewWindow({
      vehicle,
      tripNumber,
      trip: {
        destination,
        purpose,
        notes,
        start_odometer: startOdometer,
        return_odometer: returnOdometer,
        departure_time: departureTime || printDate,
        return_time: returnTime,
      },
    });
  };

  const handleDownloadPdf = async () => {
    if (!vehicle?.id) return;
    setIsProcessing(true);
    try {
      const params = new URLSearchParams({
        trip_number: tripNumber,
        date: printDate,
        destination,
        purpose,
        notes: notes || "",
        start_odometer: startOdometer || "0",
        return_odometer: returnOdometer || "",
        departure_time: departureTime || "",
        return_time: returnTime || "",
      });
      await downloadAuthedFile(
        `reports/transportation/vehicle/${vehicle.id}/trip-ticket/?${params.toString()}`,
        `امر_تحرك_${vehicle.plate_number || vehicle.id}_${tripNumber}.pdf`
      );
      showToast("تم بدء تنزيل أمر التحرك الرسمي", "success");
    } catch {
      showToast("تعذر تنزيل ملف PDF", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-[28px] border border-slate-200/80 dark:border-white/10">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-start">
              <DialogTitle className="text-title font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#2B95E8]" />
                <span>بطاقة حركة ومأمورية مركبة رسمية</span>
              </DialogTitle>
              <DialogDescription className="text-caption">
                إذن تحرك ومأمورية رسمي للمركبات وأطقم القيادة والتسليح
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handlePrint} className="gap-1.5 rounded-xl font-bold">
                <Printer className="w-4 h-4" />
                <span>طباعة الأمر</span>
              </Button>
            </div>
          </div>

          {/* Quick Adjustment Controls */}
          <div className="space-y-3 mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 text-start">
                <label className="text-caption font-bold text-slate-700 dark:text-slate-300">وجهة التحرك / خط السير:</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="وجهة التحرك..."
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1A2038] text-body-sm font-semibold"
                />
              </div>
              <div className="space-y-1 text-start">
                <label className="text-caption font-bold text-slate-700 dark:text-slate-300">الغرض من التحرك:</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="الغرض من التحرك..."
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1A2038] text-body-sm font-semibold"
                />
              </div>
              <div className="space-y-1 text-start">
                <label className="text-caption font-bold text-slate-700 dark:text-slate-300">ملاحظات ومأمورية التحرك:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية..."
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1A2038] text-body-sm font-semibold"
                />
              </div>
            </div>

            {/* Trip Return & Odometer Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
              <div className="space-y-1 text-start">
                <label className="text-caption font-bold text-slate-700 dark:text-slate-300">عداد البداية (كم):</label>
                <input
                  type="number"
                  value={startOdometer}
                  onChange={(e) => setStartOdometer(e.target.value)}
                  placeholder="0"
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1A2038] text-caption font-mono font-bold"
                />
              </div>
              <div className="space-y-1 text-start">
                <label className="text-caption font-bold text-emerald-700 dark:text-emerald-400">عداد العودة (كم):</label>
                <input
                  type="number"
                  value={returnOdometer}
                  onChange={(e) => setReturnOdometer(e.target.value)}
                  placeholder="عداد الرجوع..."
                  className="w-full h-8 px-2.5 rounded-lg border border-emerald-300 dark:border-emerald-700/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-caption font-mono font-bold"
                />
              </div>
              <div className="space-y-1 text-start">
                <label className="text-caption font-bold text-slate-700 dark:text-slate-300">ساعة الخروج:</label>
                <input
                  type="text"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  placeholder="مثال: 08:30 ص"
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1A2038] text-caption"
                />
              </div>
              <div className="space-y-1 text-start">
                <label className="text-caption font-bold text-emerald-700 dark:text-emerald-400">ساعة الرجوع:</label>
                <input
                  type="text"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  placeholder="مثال: 14:00 م"
                  className="w-full h-8 px-2.5 rounded-lg border border-emerald-300 dark:border-emerald-700/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-caption font-semibold"
                />
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Printable Trip Order Paper */}
        <div className="p-8 bg-white text-slate-900 font-sans print:p-0 print:m-0" id="vehicle-trip-print">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
            <div className="text-right space-y-1">
              <p className="font-bold text-body-sm text-slate-900">دولة ليبيا</p>
              <p className="font-bold text-body-sm text-slate-900">الجهاز الوطني للقوى المساندة</p>
              <p className="text-caption text-slate-600">قسم النقلية والآليات</p>
            </div>

            <div className="flex flex-col items-center">
              <img src={nasfSeal} alt="شعار الجهاز" className="w-16 h-16 object-contain rounded-full border border-slate-200 p-0.5" />
              <span className="text-caption font-bold text-slate-700 mt-1">أمر تحرك رقم: {tripNumber}</span>
            </div>

            <div className="text-left space-y-1 font-mono text-caption">
              <p>التاريخ: {printDate}</p>
              <p>نوع المهمة: مأمورية رسمية</p>
              <p className="font-bold text-emerald-700">التصريح: ساري المفعول</p>
            </div>
          </div>

          <div className="text-center my-4">
            <h2 className="text-title font-bold text-slate-900 underline decoration-2 underline-offset-8">
              أمر تحرك وبطاقة تشغيل مركبة
            </h2>
          </div>

          {/* Vehicle Specifications */}
          <div className="my-6 p-4 rounded-2xl border border-slate-300 bg-slate-50/70 space-y-3">
            <h4 className="font-bold text-body-sm text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Car className="w-4 h-4 text-[#2B95E8]" />
              <span>أولاً: بيانات المركبة والآلية</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-caption">
              <div>
                <span className="text-slate-500 block">اسم وموديل المركبة:</span>
                <span className="font-bold text-slate-900 text-body-sm">{vehicle.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">رقم اللوحة:</span>
                <span className="font-bold text-slate-900 font-mono">{vehicle.plate_number || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">رقم الهيكل (VIN):</span>
                <span className="font-bold text-slate-900 font-mono">{vehicle.vin_number || vehicle.chassis_number || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">جهة التبعية:</span>
                <span className="font-bold text-slate-900">
                  {vehicle.external_unit_name ? `جهة خارجية: ${vehicle.external_unit_name}` : vehicle.faction_name ? `الجهاز: ${vehicle.faction_name}` : "الإدارة العامة"}
                </span>
              </div>
            </div>
          </div>

          {/* Crew & Weaponry Details */}
          <div className="my-6 p-4 rounded-2xl border border-slate-300 bg-slate-50/70 space-y-3">
            <h4 className="font-bold text-body-sm text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <User className="w-4 h-4 text-[#2B95E8]" />
              <span>ثانياً: طاقم المركبة والتسليح الميداني وبيانات المهمة</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-caption">
              <div>
                <span className="text-slate-500 block">السائق المكلف:</span>
                <span className="font-bold text-slate-900 text-body-sm">{vehicle.driver_name || vehicle.assigned_driver_name || "غير محدد"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">وجهة التحرك:</span>
                <span className="font-bold text-slate-900 text-body-sm text-[#2B95E8]">{destination || "وفق خط السير المعتمد"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">الغرض من التحرك:</span>
                <span className="font-bold text-slate-900 text-body-sm">{purpose || "مهمة إدارية / عملياتية رسمية"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">السلاح المثبت:</span>
                <span className="font-bold text-slate-900">{vehicle.has_weapon ? (vehicle.mounted_weapon_name || vehicle.weapon_name || "مثبت") : "غير مسلحة"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">رقم السلاح:</span>
                <span className="font-bold text-slate-900 font-mono">{vehicle.mounted_weapon_serial || vehicle.weapon_serial_number || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">الرامي المكلف:</span>
                <span className="font-bold text-slate-900">{vehicle.weapon_operator_name || vehicle.assigned_gunner_name || "—"}</span>
              </div>
            </div>
          </div>

          {/* Mission Details Form Fields */}
          <div className="my-6 space-y-3">
            <h4 className="font-bold text-body-sm text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#2B95E8]" />
              <span>ثالثاً: خط السير وقراءات العداد</span>
            </h4>
            <table className="w-full text-right text-caption border-collapse border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300 text-slate-800">
                <tr>
                  <th className="p-2 border border-slate-300">نقطة الانطلاق</th>
                  <th className="p-2 border border-slate-300">الوجهة / خط السير</th>
                  <th className="p-2 border border-slate-300">عداد البداية (كم)</th>
                  <th className="p-2 border border-slate-300">عداد العودة (كم)</th>
                  <th className="p-2 border border-slate-300">ساعة الخروج</th>
                  <th className="p-2 border border-slate-300">ساعة الرجوع</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-slate-300">مقر الجهاز الرئيسي</td>
                  <td className="p-3 border border-slate-300 font-semibold text-[#2B95E8]">{destination || "وفق خط السير المعتمد"}</td>
                  <td className="p-3 border border-slate-300 font-mono font-bold">{startOdometer || vehicle.odometer_reading || "0"} كم</td>
                  <td className="p-3 border border-slate-300 font-mono font-bold text-emerald-700">{returnOdometer ? `${returnOdometer} كم` : "..................... كم"}</td>
                  <td className="p-3 border border-slate-300 font-mono">{departureTime || "........ : ........"}</td>
                  <td className="p-3 border border-slate-300 font-mono font-bold text-emerald-700">{returnTime || "........ : ........"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes & Mission Directives */}
          {notes && (
            <div className="my-6 p-4 rounded-xl border border-slate-300 bg-slate-50/70 text-caption text-slate-800 space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>ملاحظات ومأمورية التحرك:</span>
              </p>
              <p className="leading-relaxed text-slate-700">{notes}</p>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-6 mt-8 border-t border-slate-300 text-caption text-center">
            <div className="space-y-12">
              <p className="font-bold text-slate-800">توقيع السائق المكلف</p>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto" />
              <p className="text-caption text-slate-500">التوقيع</p>
            </div>

            <div className="space-y-12">
              <p className="font-bold text-slate-800">مسؤول قسم النقلية</p>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto" />
              <p className="text-caption text-slate-500">التوقيع والختم</p>
            </div>

            <div className="space-y-12">
              <p className="font-bold text-slate-800">اعتماد آمر العمليات</p>
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
              <span>تحميل أمر التحرك (PDF)</span>
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

export default VehicleTripVoucherDialog;
