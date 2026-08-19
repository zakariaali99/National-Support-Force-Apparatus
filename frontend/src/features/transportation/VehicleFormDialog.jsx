import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/Dialog";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Switch } from "../../components/ui/Switch";
import { Textarea } from "../../components/ui/Textarea";
import { useFactions } from "../organization/api";
import { useMembers } from "../members/api";
import { useCreateVehicle, useUpdateVehicle, useExternalUnits } from "./api";
import { showToast } from "../../components/ui/Toast";
import {
  Car,
  Crosshair,
  UserCheck,
  AlertCircle,
  Building2,
  Globe,
  Settings,
} from "lucide-react";

const VEHICLE_TYPES = [
  { value: "patrol", label: "دورية / استطلاع" },
  { value: "armored", label: "مصفحة" },
  { value: "pickup", label: "بيك آب / دفع رباعي" },
  { value: "transport", label: "نقل أفراد" },
  { value: "truck", label: "شاحنة نقل / إمداد" },
  { value: "ambulance", label: "إسعاف" },
  { value: "sedan", label: "صالون / إدارية" },
  { value: "other", label: "أخرى" },
];

const VEHICLE_STATUSES = [
  { value: "ready", label: "جاهزة للخدمة" },
  { value: "maintenance", label: "تحت الصيانة" },
  { value: "damaged", label: "معطلة" },
  { value: "retired", label: "خارج الخدمة" },
];

export function VehicleFormDialog({ open, onOpenChange, vehicle = null }) {
  const isEdit = Boolean(vehicle);
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();

  const { data: factionsRaw } = useFactions({ enabled: Boolean(open) });
  const { data: externalUnitsRaw } = useExternalUnits({ is_active: true }, { enabled: Boolean(open) });
  const { data: membersRaw } = useMembers({ page_size: 200 }, { enabled: Boolean(open) });

  const factions = useMemo(() => {
    if (!factionsRaw) return [];
    if (Array.isArray(factionsRaw)) return factionsRaw;
    if (Array.isArray(factionsRaw.results)) return factionsRaw.results;
    return [];
  }, [factionsRaw]);

  const externalUnits = useMemo(() => {
    if (!externalUnitsRaw) return [];
    if (Array.isArray(externalUnitsRaw)) return externalUnitsRaw;
    if (Array.isArray(externalUnitsRaw.results)) return externalUnitsRaw.results;
    return [];
  }, [externalUnitsRaw]);

  const members = useMemo(() => {
    if (!membersRaw) return [];
    if (Array.isArray(membersRaw)) return membersRaw;
    if (Array.isArray(membersRaw.results)) return membersRaw.results;
    return [];
  }, [membersRaw]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      vehicle_type: "pickup",
      vin_number: "",
      plate_number: "",
      model_year: "",
      color: "",
      status: "ready",
      affiliation_type: "internal",
      faction: "",
      external_unit: "",
      assigned_driver: "",
      has_weapon: false,
      mounted_weapon_name: "",
      mounted_weapon_serial: "",
      weapon_affiliation_type: "internal",
      weapon_faction: "",
      weapon_external_unit: "",
      weapon_assigned_member: "",
      notes: "",
    },
  });

  const affiliationType = watch("affiliation_type");
  const weaponAffiliationType = watch("weapon_affiliation_type");
  const hasWeapon = watch("has_weapon");

  useEffect(() => {
    if (vehicle) {
      reset({
        name: vehicle.name || "",
        vehicle_type: vehicle.vehicle_type || "pickup",
        vin_number: vehicle.vin_number || "",
        plate_number: vehicle.plate_number || "",
        model_year: vehicle.model_year ? String(vehicle.model_year) : "",
        color: vehicle.color || "",
        status: vehicle.status || "ready",
        affiliation_type: vehicle.affiliation_type || (vehicle.external_unit ? "external" : "internal"),
        faction: vehicle.faction ? String(vehicle.faction) : "",
        external_unit: vehicle.external_unit ? String(vehicle.external_unit) : "",
        assigned_driver: vehicle.assigned_driver ? String(vehicle.assigned_driver) : "",
        has_weapon: Boolean(vehicle.has_weapon),
        mounted_weapon_name: vehicle.mounted_weapon_name || "",
        mounted_weapon_serial: vehicle.mounted_weapon_serial || "",
        weapon_affiliation_type: vehicle.weapon_affiliation_type || (vehicle.weapon_external_unit ? "external" : "internal"),
        weapon_faction: vehicle.weapon_faction ? String(vehicle.weapon_faction) : "",
        weapon_external_unit: vehicle.weapon_external_unit ? String(vehicle.weapon_external_unit) : "",
        weapon_assigned_member: vehicle.weapon_assigned_member ? String(vehicle.weapon_assigned_member) : "",
        notes: vehicle.notes || "",
      });
    } else {
      reset({
        name: "",
        vehicle_type: "pickup",
        vin_number: "",
        plate_number: "",
        model_year: "",
        color: "",
        status: "ready",
        affiliation_type: "internal",
        faction: "",
        external_unit: "",
        assigned_driver: "",
        has_weapon: false,
        mounted_weapon_name: "",
        mounted_weapon_serial: "",
        weapon_affiliation_type: "internal",
        weapon_faction: "",
        weapon_external_unit: "",
        weapon_assigned_member: "",
        notes: "",
      });
    }
  }, [vehicle, reset, open]);

  const onSubmit = async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        vehicle_type: values.vehicle_type,
        vin_number: values.vin_number.trim(),
        plate_number: values.plate_number ? values.plate_number.trim() : "",
        model_year: values.model_year ? parseInt(values.model_year, 10) : null,
        color: values.color ? values.color.trim() : "",
        status: values.status,
        affiliation_type: values.affiliation_type,
        faction: values.affiliation_type === "internal" && values.faction ? parseInt(values.faction, 10) : null,
        external_unit: values.affiliation_type === "external" && values.external_unit ? parseInt(values.external_unit, 10) : null,
        assigned_driver: values.assigned_driver ? parseInt(values.assigned_driver, 10) : null,
        has_weapon: Boolean(values.has_weapon),
        mounted_weapon_name: values.has_weapon ? (values.mounted_weapon_name || "").trim() : "",
        mounted_weapon_serial: values.has_weapon ? (values.mounted_weapon_serial || "").trim() : "",
        weapon_affiliation_type: values.weapon_affiliation_type,
        weapon_faction:
          values.has_weapon && values.weapon_affiliation_type === "internal" && values.weapon_faction
            ? parseInt(values.weapon_faction, 10)
            : null,
        weapon_external_unit:
          values.has_weapon && values.weapon_affiliation_type === "external" && values.weapon_external_unit
            ? parseInt(values.weapon_external_unit, 10)
            : null,
        weapon_assigned_member:
          values.has_weapon && values.weapon_assigned_member
            ? parseInt(values.weapon_assigned_member, 10)
            : null,
        notes: values.notes ? values.notes.trim() : "",
      };

      if (isEdit) {
        await updateVehicle.mutateAsync({ id: vehicle.id, data: payload });
        showToast({ title: "تم تحديث بيانات المركبة بنجاح", type: "success" });
      } else {
        await createVehicle.mutateAsync(payload);
        showToast({ title: "تم تسجيل المركبة بنجاح", type: "success" });
      }
      onOpenChange(false);
    } catch (err) {
      const errData = err.response?.data;
      let errorMsg = "تأكد من صحة البيانات المدخلة";
      if (errData) {
        if (typeof errData === "string") errorMsg = errData;
        else if (errData.detail) errorMsg = errData.detail;
        else if (typeof errData === "object") {
          errorMsg = Object.entries(errData)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join(" | ");
        }
      }
      showToast({
        title: "خطأ أثناء حفظ المركبة",
        description: errorMsg,
        type: "error",
      });
    }
  };

  const selectStyle =
    "w-full h-11 px-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-body-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:!bg-white dark:focus:!bg-[#101422] focus:border-[#2B95E8] focus:ring-3 focus:ring-[#2B95E8]/20 transition-all";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038]">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
          <DialogTitle className="text-title font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-[#2B95E8]" />
            <span>{isEdit ? `تعديل بيانات المركبة: ${vehicle.name}` : "تسجيل مركبة أو آلية جديدة"}</span>
          </DialogTitle>
          <DialogDescription className="text-caption text-slate-500">
            أدخل مواصفات الآلية، التبعية الإدارية، السائق المسؤول، وبيانات التسليح الميداني
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 text-start">
          {/* Section 1: Vehicle Specifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/10 pb-2">
              <div className="p-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                <Car className="w-4 h-4" />
              </div>
              <span className="text-body-sm font-bold text-slate-900 dark:text-slate-100">المواصفات الفنية للآلية</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-label text-slate-800 dark:text-slate-200">
                  اسم أو طراز المركبة <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="مثال: تويوتا لاندكروزر / نيسان باترول / مصفحة فهد"
                  {...register("name", { required: "اسم المركبة مطلوب" })}
                  className={errors.name ? "border-rose-500" : ""}
                />
                {errors.name && <p className="text-micro text-rose-500 font-semibold">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vehicle_type" className="text-label text-slate-800 dark:text-slate-200">
                  تصنيف ونوع الآلية <span className="text-rose-500">*</span>
                </Label>
                <select id="vehicle_type" {...register("vehicle_type")} className={selectStyle}>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vin_number" className="text-label text-slate-800 dark:text-slate-200">
                  رقم الهيكل / VIN <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="vin_number"
                  placeholder="مثال: JTEBU25J..."
                  dir="ltr"
                  className={`font-mono ${errors.vin_number ? "border-rose-500" : ""}`}
                  {...register("vin_number", { required: "رقم الهيكل مطلوب" })}
                />
                {errors.vin_number && <p className="text-micro text-rose-500 font-semibold">{errors.vin_number.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plate_number" className="text-label text-slate-800 dark:text-slate-200">
                  رقم اللوحة المعدنية
                </Label>
                <Input
                  id="plate_number"
                  placeholder="مثال: 5-12345 / لوحة عسكرية"
                  dir="ltr"
                  className="font-mono"
                  {...register("plate_number")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="model_year" className="text-label text-slate-800 dark:text-slate-200">سنة الصنع / الموديل</Label>
                <Input
                  id="model_year"
                  type="number"
                  placeholder="مثال: 2023"
                  dir="ltr"
                  className="font-mono"
                  {...register("model_year")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="color" className="text-label text-slate-800 dark:text-slate-200">اللون / التمويه</Label>
                <Input id="color" placeholder="مثال: أبيض / صحراوي مموه / أسود" {...register("color")} />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="status" className="text-label text-slate-800 dark:text-slate-200">الحالة التشغيلية للمركبة</Label>
                <select id="status" {...register("status")} className={selectStyle}>
                  {VEHICLE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Affiliation & Driver Assignment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/10 pb-2">
              <div className="p-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-body-sm font-bold text-slate-900 dark:text-slate-100">تبعية المركبة والسائق</span>
            </div>

            {/* Affiliation Type Switcher */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2">
              <Label className="text-caption font-bold text-slate-700 dark:text-gray-300">جهة تبعية الآلية / المركبة *</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setValue("affiliation_type", "internal")}
                  className={`p-2.5 rounded-xl border text-caption font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    affiliationType === "internal"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-white/10 hover:bg-slate-100"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  تابعة للجهاز (فصيل داخلي)
                </button>
                <button
                  type="button"
                  onClick={() => setValue("affiliation_type", "external")}
                  className={`p-2.5 rounded-xl border text-caption font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    affiliationType === "external"
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-white/10 hover:bg-slate-100"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  تابعة لوحدة / جهة خارجية
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {affiliationType === "internal" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="faction" className="text-label text-slate-800 dark:text-slate-200">
                    الفصيل / القسم التابعة له المركبة
                  </Label>
                  <select id="faction" {...register("faction")} className={selectStyle}>
                    <option value="">غير محدد / عام</option>
                    {factions.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="external_unit" className="text-label text-slate-800 dark:text-slate-200">
                      الوحدة أو الجهة الخارجية <span className="text-rose-500">*</span>
                    </Label>
                    <Link
                      to="/settings/external-units"
                      className="text-micro text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                    >
                      <Settings className="w-3 h-3" />
                      إدارة الوحدات الخارجية
                    </Link>
                  </div>
                  <select id="external_unit" {...register("external_unit")} className={selectStyle} required>
                    <option value="">اختر الوحدة أو الجهة الخارجية</option>
                    {externalUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name_ar} {u.code ? `(${u.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="assigned_driver" className="text-label text-slate-800 dark:text-slate-200">
                  السائق أو المسؤول عن المركبة
                </Label>
                <select id="assigned_driver" {...register("assigned_driver")} className={selectStyle}>
                  <option value="">غير معين (سائق نوبة / المستودع)</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.force_number || "بدون رقم"}) — {m.faction_name || ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Weapon Attachment */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  <Crosshair className="w-4 h-4" />
                </div>
                <div>
                  <Label htmlFor="has_weapon_toggle" className="text-body-sm font-bold text-slate-900 dark:text-slate-100 cursor-pointer">
                    هل تملك الآلية سلاحاً مثبتاً؟
                  </Label>
                  <p className="text-caption text-slate-500">
                    تفعيل هذا الخيار يتيح تسجيل السلاح وراميه بتبعية مستقلة عن السيارة.
                  </p>
                </div>
              </div>
              <Switch
                id="has_weapon_toggle"
                checked={hasWeapon}
                onCheckedChange={(checked) => setValue("has_weapon", checked)}
              />
            </div>

            {hasWeapon && (
              <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 text-caption font-semibold">
                  <AlertCircle className="w-4 h-4 text-[#2B95E8]" />
                  <span>بيانات التسليح وتبعية السلاح (منفصلة عن تبعية المركبة)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="mounted_weapon_name" className="text-label text-slate-800 dark:text-slate-200">
                      اسم / نوع السلاح المثبت <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="mounted_weapon_name"
                      placeholder="مثال: رشاش دوشكا 12.7 مم / رشاش 14.5"
                      {...register("mounted_weapon_name", {
                        required: hasWeapon ? "اسم السلاح مطلوب عند التفعيل" : false,
                      })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mounted_weapon_serial" className="text-label text-slate-800 dark:text-slate-200">
                      رقم السلاح التسلسلي <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="mounted_weapon_serial"
                      placeholder="مثال: WPN-DSHK-0921"
                      dir="ltr"
                      className="font-mono"
                      {...register("mounted_weapon_serial", {
                        required: hasWeapon ? "رقم السلاح مطلوب عند التفعيل" : false,
                      })}
                    />
                  </div>

                  {/* Weapon Affiliation Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-label text-slate-800 dark:text-slate-200">جهة تبعية السلاح</Label>
                    <select
                      value={weaponAffiliationType}
                      onChange={(e) => setValue("weapon_affiliation_type", e.target.value)}
                      className={selectStyle}
                    >
                      <option value="internal">تابعة للجهاز (فصيل داخلي)</option>
                      <option value="external">تابعة لجهة خارجية</option>
                    </select>
                  </div>

                  {weaponAffiliationType === "internal" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="weapon_faction" className="text-label text-slate-800 dark:text-slate-200">
                        فصيل تبعية السلاح
                      </Label>
                      <select id="weapon_faction" {...register("weapon_faction")} className={selectStyle}>
                        <option value="">نفس فصيل المركبة</option>
                        {factions.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name_ar}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="weapon_external_unit" className="text-label text-slate-800 dark:text-slate-200">
                        الوحدة الخارجية للسلاح
                      </Label>
                      <select id="weapon_external_unit" {...register("weapon_external_unit")} className={selectStyle}>
                        <option value="">اختر الوحدة الخارجية للسلاح</option>
                        {externalUnits.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name_ar}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="weapon_assigned_member" className="text-label text-slate-800 dark:text-slate-200">
                      الرامي المكلف بالسلاح
                    </Label>
                    <select id="weapon_assigned_member" {...register("weapon_assigned_member")} className={selectStyle}>
                      <option value="">غير معين (رامي نوبة)</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name} ({m.force_number || "بدون رقم"}) — {m.faction_name || ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-label text-slate-800 dark:text-slate-200">ملاحظات إضافية عن المركبة</Label>
            <Textarea
              id="notes"
              placeholder="تجهيزات خاصة، حالة الإطارات، تجهيزات الاتصال..."
              {...register("notes")}
              rows={2}
              className="rounded-2xl resize-none text-body-sm"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl px-5 font-bold">
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting || createVehicle.isPending || updateVehicle.isPending} className="rounded-xl px-6 font-bold">
              {isSubmitting || createVehicle.isPending || updateVehicle.isPending ? "جارٍ الحفظ..." : isEdit ? "تحديث البيانات" : "تسجيل المركبة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default VehicleFormDialog;
