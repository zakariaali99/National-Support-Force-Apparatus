import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { api } from "../../lib/api";
import { printAssetCardInNewWindow } from "../../lib/printUtils";
import sealUrl from "../../assets/brand/nasf-seal.jpg";
import {
  Printer,
  Shield,
  Car,
  Crosshair,
  Package,
  Calendar,
  User,
  Building2,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  FileText,
} from "lucide-react";

const STATUS_LABELS = {
  ready: { label: "جاهزة للخدمة", variant: "success" },
  good: { label: "صالح للاستعمال", variant: "success" },
  maintenance: { label: "تحت الصيانة", variant: "warning" },
  damaged: { label: "تالف / معطل", variant: "danger" },
  retired: { label: "خارج الخدمة", variant: "secondary" },
};

const ACTION_LABELS = {
  assigned: { label: "تسليم / صرف عهدة", color: "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/40 border-blue-200" },
  returned: { label: "إرجاع واستلام", color: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 border-emerald-200" },
  maintenance: { label: "إحالة للصيانة", color: "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40 border-amber-200" },
  damaged: { label: "تسجيل تلف/عطل", color: "text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40 border-rose-200" },
  transfer: { label: "نقل تبعية", color: "text-purple-700 bg-purple-50 dark:text-purple-300 dark:bg-purple-950/40 border-purple-200" },
};

export function AssetDetailHistoryDialog({ open, onOpenChange, item, type = "weapon" }) {
  const printAreaRef = useRef(null);

  // Fetch custody / possession history for item
  const { data: rawHistory = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ["asset-history", type, item?.id],
    queryFn: async () => {
      if (!item?.id) return [];
      if (type === "vehicle") {
        const res = await api.get("transportation/vehicle-custody-records/", {
          params: { vehicle: item.id },
        });
        return res.data;
      } else {
        const res = await api.get("equipment/custody/", {
          params: { item: item.id },
        });
        return res.data;
      }
    },
    enabled: Boolean(open && item?.id),
  });

  const history = Array.isArray(rawHistory) ? rawHistory : rawHistory?.results || [];

  if (!item) return null;

  const statusBadge = STATUS_LABELS[item.status] || { label: item.status || "—", variant: "secondary" };

  const handlePrint = () => {
    printAssetCardInNewWindow({ item, history, type });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2B95E8]/10 text-[#2B95E8] flex items-center justify-center shrink-0 border border-[#2B95E8]/20">
                {type === "vehicle" ? (
                  <Car className="w-6 h-6" />
                ) : type === "weapon" ? (
                  <Crosshair className="w-6 h-6" />
                ) : (
                  <Package className="w-6 h-6" />
                )}
              </div>
              <div className="text-start">
                <DialogTitle className="text-title font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{item.name}</span>
                  <Badge variant={statusBadge.variant} className="text-caption font-bold">
                    {statusBadge.label}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-caption text-slate-500 font-medium mt-0.5">
                  {type === "vehicle" && `رقم الهيكل: ${item.vin_number || "—"} | اللوحة: ${item.plate_number || "—"}`}
                  {type === "weapon" && `الرقم التسلسلي: ${item.serial_number || "—"} | العيار: ${item.caliber || "—"}`}
                  {type === "inventory" && `كود الصنف: ${item.item_code || "—"} | التصنيف: ${item.category_name || "—"}`}
                </DialogDescription>
              </div>
            </div>

            <Button
              onClick={handlePrint}
              variant="outline"
              className="gap-2 font-bold rounded-xl border-slate-200 dark:border-white/10 shadow-xs"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>طباعة بطاقة الأصل وسجل الحيازة (نافذة جديدة)</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Printable & Screen Area */}
        <div ref={printAreaRef} className="p-6 space-y-6 text-start">
          {/* Printable Header (Visible only in print mode) */}
          <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <img src={sealUrl} alt="شعار الجهاز" className="w-14 h-14 object-cover rounded-xl" />
              <div>
                <h1 className="text-lg font-bold text-slate-900">دولة ليبيا — الجهاز الوطني للقوى المساندة</h1>
                <p className="text-sm text-slate-600 font-medium">الوحدة القتالية الرابعة — بطاقة الأصل وسلسلة الحيازة الرسمية</p>
              </div>
            </div>
            <div className="text-end text-xs text-slate-500 font-mono">
              <p>تاريخ الطباعة: {new Date().toLocaleDateString("ar-LY")}</p>
              <p>الرقم المرجعي: #{item.id}</p>
            </div>
          </div>

          {/* Section 1: Specifications Card */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4.5 space-y-3">
            <h3 className="text-caption font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2B95E8]" />
              بطاقة البيانات والمواصفات الفنية
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-caption">
              {type === "vehicle" && (
                <>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 block">طراز الآلية</span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.vehicle_type_display || item.vehicle_type || "—"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 block">رقم اللوحة</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white dir-ltr">{item.plate_number || "—"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 block">رقم الهيكل / VIN</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white dir-ltr">{item.vin_number || "—"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 block">سنة الصنع / اللون</span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.model_year || "—"} / {item.color || "—"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 block">التبعية الإدارية</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.affiliation_type === "external"
                        ? `جهة خارجية (${item.external_unit_name || "—"})`
                        : `فصيل داخلي (${item.faction_name || "عام"})`}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 block">السائق / المسؤول الحالي</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.driver_name ? `${item.driver_name} (${item.driver_force_number || "—"})` : "المستودع الرئيسي (غير مخصص)"}
                    </span>
                  </div>
                  {item.has_weapon && (
                    <>
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30">
                        <span className="text-amber-800 dark:text-amber-300 block">السلاح المثبت</span>
                        <span className="font-bold text-amber-950 dark:text-amber-100">{item.mounted_weapon_name || "—"}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30">
                        <span className="text-amber-800 dark:text-amber-300 block">رامي السلاح</span>
                        <span className="font-bold text-amber-950 dark:text-amber-100">{item.weapon_operator_name || "غير محدد"}</span>
                      </div>
                    </>
                  )}
                </>
              )}

              {type === "weapon" && (
                <>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 block">التصنيف والنوع</span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.category_name || item.category_type_display || "—"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 block">الرقم التسلسلي</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white dir-ltr">{item.serial_number || "—"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 block">العيار / الطراز</span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.caliber || "—"} / {item.model_name || "—"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 block">رصيد المخزن والعهد</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      المتوفر: {item.available_quantity} / المصروف: {item.assigned_quantity} / الإجمالي: {item.total_quantity}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5 sm:col-span-2">
                    <span className="text-slate-500 block">العهدة الحالية</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.assigned_member_name ? `${item.assigned_member_name} (${item.assigned_member_force_number || "—"})` : "خزينة السلاح الرئيسية"}
                    </span>
                  </div>
                </>
              )}

              {type === "inventory" && (
                <>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 block">التصنيف المخزني</span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.category_name || "—"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 block">كود الصنف / الباركود</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white dir-ltr">{item.item_code || "—"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 block">المقاس / المواصفة</span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.size_spec || item.model_name || "—"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 block">الكميات (المتوفر / العهد)</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      المتوفر: {item.available_quantity} / العهدة: {item.assigned_quantity} / الإجمالي: {item.total_quantity}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5 sm:col-span-2">
                    <span className="text-slate-500 block">العهدة الحالية</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.assigned_member_name ? `${item.assigned_member_name} (${item.assigned_member_force_number || "—"})` : "المستودع العام"}
                    </span>
                  </div>
                </>
              )}
            </div>

            {item.notes && (
              <div className="pt-2 text-caption text-slate-600 dark:text-slate-300">
                <span className="font-bold">ملاحظات التخزين: </span>
                {item.notes}
              </div>
            )}
          </div>

          {/* Section 2: Possession Chain Log */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-body-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-[#2B95E8]" />
                <span>سجل حركة وسلسلة الحيازة (Possession Chain Log)</span>
              </h3>
              <span className="text-caption text-slate-500 font-semibold">
                إجمالي السجلات: {history.length}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
              <table className="w-full text-start text-caption">
                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-gray-300 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 text-start">التاريخ</th>
                    <th className="py-2.5 px-3 text-start">نوع الإجراء</th>
                    <th className="py-2.5 px-3 text-start">المستلم / السائق / الجهة</th>
                    {type !== "vehicle" && <th className="py-2.5 px-3 text-center">الكمية</th>}
                    {type === "vehicle" && <th className="py-2.5 px-3 text-center">العداد (كم)</th>}
                    <th className="py-2.5 px-3 text-start">الملاحظات وتقرير الحالة</th>
                    <th className="py-2.5 px-3 text-start">المسؤول المصرح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {isHistoryLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                        جارٍ تحميل سجل الحيازة...
                      </td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                        لا توجد حركات حيازة أو تسليم مسجلة بعد لهذا الأصل.
                      </td>
                    </tr>
                  ) : (
                    history.map((rec) => {
                      const actionStyle = ACTION_LABELS[rec.action] || {
                        label: rec.action_display || rec.action,
                        color: "text-slate-700 bg-slate-100 dark:bg-white/10 border-slate-200",
                      };
                      const personName =
                        rec.driver_name ||
                        rec.member_name ||
                        rec.external_unit_name ||
                        rec.faction_name ||
                        "—";
                      const forceNum = rec.driver_force_number || rec.member_force_number;

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap">
                            {rec.action_date || rec.assigned_date || (rec.created_at ? rec.created_at.split("T")[0] : "—")}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-micro font-bold border ${actionStyle.color}`}>
                              {actionStyle.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            <span>{personName}</span>
                            {forceNum && (
                              <span className="text-micro font-mono text-slate-400 ms-1">
                                ({forceNum})
                              </span>
                            )}
                          </td>
                          {type !== "vehicle" && (
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                              {rec.quantity || 1}
                            </td>
                          )}
                          {type === "vehicle" && (
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                              {rec.odometer ? `${rec.odometer.toLocaleString()} كم` : "—"}
                            </td>
                          )}
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                            {rec.notes || "—"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-micro">
                            {rec.issued_by_name || "النظام"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Printable Signature Footer (Visible only in print mode) */}
          <div className="hidden print:grid grid-cols-3 gap-8 pt-10 border-t border-slate-200 mt-12 text-center text-sm font-bold">
            <div>
              <p className="text-slate-600">ضابط / مسؤول العهدة</p>
              <div className="h-14 border-b border-dashed border-slate-300 mt-2" />
              <p className="text-xs text-slate-400 mt-1">الاسم والتوقيع</p>
            </div>
            <div>
              <p className="text-slate-600">المستلم / الحائز الحالي</p>
              <div className="h-14 border-b border-dashed border-slate-300 mt-2" />
              <p className="text-xs text-slate-400 mt-1">الاسم والتوقيع</p>
            </div>
            <div>
              <p className="text-slate-600">اعتماد رئيس القسم / الآمر</p>
              <div className="h-14 border-b border-dashed border-slate-300 mt-2" />
              <p className="text-xs text-slate-400 mt-1">الختم والاعتماد</p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-white/[0.02] print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-5 font-bold"
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AssetDetailHistoryDialog;
