import { useState, useRef } from "react";
import { Printer, Car, User, Shield, MapPin, FileCheck2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import nasfSeal from "../../assets/brand/nasf-seal.jpg";

export function VehicleTripVoucherDialog({ vehicle, open, onOpenChange }) {
  const [printDate] = useState(() => new Date().toISOString().split("T")[0]);
  const tripNumber = useRef(`TRIP-${Math.floor(100000 + Math.random() * 900000)}`).current;

  const handlePrint = () => {
    window.print();
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
                <span className="font-bold text-slate-900 font-mono">{vehicle.chassis_number || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">الفصيل التابعة له:</span>
                <span className="font-bold text-slate-900">{vehicle.faction_name || "الإدارة العامة"}</span>
              </div>
            </div>
          </div>

          {/* Crew & Weaponry Details */}
          <div className="my-6 p-4 rounded-2xl border border-slate-300 bg-slate-50/70 space-y-3">
            <h4 className="font-bold text-body-sm text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <User className="w-4 h-4 text-[#2B95E8]" />
              <span>ثانياً: طاقم المركبة والتسليح الميداني المعتمد</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-caption">
              <div>
                <span className="text-slate-500 block">السائق المكلف:</span>
                <span className="font-bold text-slate-900 text-body-sm">{vehicle.assigned_driver_name || "غير محدد"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">السلاح المثبت:</span>
                <span className="font-bold text-slate-900">{vehicle.has_weapon ? (vehicle.weapon_name || "مثبت") : "غير مسلحة"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">رقم السلاح:</span>
                <span className="font-bold text-slate-900 font-mono">{vehicle.weapon_serial_number || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">الرامي المكلف:</span>
                <span className="font-bold text-slate-900">{vehicle.assigned_gunner_name || "—"}</span>
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
                  <td className="p-3 border border-slate-300">..................................</td>
                  <td className="p-3 border border-slate-300 font-mono font-bold">{vehicle.odometer_reading || "0"} كم</td>
                  <td className="p-3 border border-slate-300">..................... كم</td>
                  <td className="p-3 border border-slate-300">........ : ........</td>
                  <td className="p-3 border border-slate-300">........ : ........</td>
                </tr>
              </tbody>
            </table>
          </div>

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

        <DialogFooter className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            إغلاق
          </Button>
          <Button variant="primary" onClick={handlePrint} className="gap-2 rounded-xl font-bold">
            <Printer className="w-4 h-4" />
            <span>طباعة أمر التحرك</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default VehicleTripVoucherDialog;
