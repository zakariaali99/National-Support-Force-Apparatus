import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/Dialog";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Select } from "../../components/ui/Select";
import { Switch } from "../../components/ui/Switch";
import { Textarea } from "../../components/ui/Textarea";
import { useFactions } from "../organization/api";
import { useMembers } from "../members/api";
import { useCreateVehicle, useUpdateVehicle } from "./api";
import { Car, Crosshair, UserCheck, AlertCircle } from "lucide-react";

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
  const { data: factions = [] } = useFactions();
  const { data: membersData } = useMembers({ page_size: 200 });
  const members = membersData?.results || (Array.isArray(membersData) ? membersData : []);

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
      faction: "",
      assigned_driver: "",
      has_weapon: false,
      mounted_weapon_name: "",
      mounted_weapon_serial: "",
      weapon_faction: "",
      weapon_assigned_member: "",
      notes: "",
    },
  });

  const hasWeapon = watch("has_weapon");

  useEffect(() => {
    if (vehicle) {
      reset({
        name: vehicle.name || "",
        vehicle_type: vehicle.vehicle_type || "pickup",
        vin_number: vehicle.vin_number || "",
        plate_number: vehicle.plate_number || "",
        model_year: vehicle.model_year || "",
        color: vehicle.color || "",
        status: vehicle.status || "ready",
        faction: vehicle.faction ? String(vehicle.faction) : "",
        assigned_driver: vehicle.assigned_driver ? String(vehicle.assigned_driver) : "",
        has_weapon: Boolean(vehicle.has_weapon),
        mounted_weapon_name: vehicle.mounted_weapon_name || "",
        mounted_weapon_serial: vehicle.mounted_weapon_serial || "",
        weapon_faction: vehicle.weapon_faction ? String(vehicle.weapon_faction) : "",
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
        faction: "",
        assigned_driver: "",
        has_weapon: false,
        mounted_weapon_name: "",
        mounted_weapon_serial: "",
        weapon_faction: "",
        weapon_assigned_member: "",
        notes: "",
      });
    }
  }, [vehicle, reset, open]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      faction: values.faction ? parseInt(values.faction, 10) : null,
      assigned_driver: values.assigned_driver ? parseInt(values.assigned_driver, 10) : null,
      weapon_faction: values.has_weapon && values.weapon_faction ? parseInt(values.weapon_faction, 10) : null,
      weapon_assigned_member:
        values.has_weapon && values.weapon_assigned_member
          ? parseInt(values.weapon_assigned_member, 10)
          : null,
      has_weapon: Boolean(values.has_weapon),
    };

    if (isEdit) {
      await updateVehicle.mutateAsync({ id: vehicle.id, data: payload });
    } else {
      await createVehicle.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>{isEdit ? "تعديل بيانات المركبة" : "إضافة مركبة / آلية جديدة"}</DialogTitle>
              <DialogDescription>تسجيل بيانات المركبة التابعة للأسطول وتعيين السائق والتسليح المستقل.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-1">
          {/* Section 1: Vehicle Base Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                <Car className="w-4 h-4" />
              </div>
              <span className="text-body-sm font-bold text-slate-900 dark:text-slate-100">بيانات الآلية والمركبة</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-label text-slate-800 dark:text-slate-200">اسم / طراز المركبة *</Label>
                <Input
                  id="name"
                  placeholder="مثال: تويوتا لاندكروزر LC79"
                  {...register("name", { required: "اسم المركبة مطلوب" })}
                />
                {errors.name && <p className="text-caption text-danger">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vehicle_type" className="text-label text-slate-800 dark:text-slate-200">نوع الآلية *</Label>
                <Select
                  value={watch("vehicle_type")}
                  onValueChange={(val) => setValue("vehicle_type", val)}
                  options={VEHICLE_TYPES}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vin_number" className="text-label text-slate-800 dark:text-slate-200">رقم الهيكل (VIN / Chassis) *</Label>
                <Input
                  id="vin_number"
                  placeholder="رقم الهيكل المعدني"
                  dir="ltr"
                  className="font-mono"
                  {...register("vin_number", { required: "رقم الهيكل مطلوب" })}
                />
                {errors.vin_number && <p className="text-caption text-danger">{errors.vin_number.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plate_number" className="text-label text-slate-800 dark:text-slate-200">رقم اللوحة العسكرية / المدنية</Label>
                <Input
                  id="plate_number"
                  placeholder="مثال: 10-12345"
                  dir="ltr"
                  className="font-mono"
                  {...register("plate_number")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="model_year" className="text-label text-slate-800 dark:text-slate-200">سنة الصنع</Label>
                <Input
                  id="model_year"
                  placeholder="مثال: 2024"
                  dir="ltr"
                  {...register("model_year")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="color" className="text-label text-slate-800 dark:text-slate-200">اللون</Label>
                <Input
                  id="color"
                  placeholder="مثال: بيج عسكري / أسود"
                  {...register("color")}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="status" className="text-label text-slate-800 dark:text-slate-200">الحالة التشغيلية</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(val) => setValue("status", val)}
                  options={VEHICLE_STATUSES}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle Driver & Faction */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-body-sm font-bold text-slate-900 dark:text-slate-100">تبعية المركبة والسائق</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="faction" className="text-label text-slate-800 dark:text-slate-200">الفصيل / القسم التابعة له المركبة</Label>
                <Select
                  value={watch("faction")}
                  onValueChange={(val) => setValue("faction", val)}
                  options={[
                    { value: "", label: "غير محدد / عام" },
                    ...factions.map((f) => ({ value: String(f.id), label: f.name_ar })),
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assigned_driver" className="text-label text-slate-800 dark:text-slate-200">السائق أو المسؤول عن المركبة</Label>
                <Select
                  value={watch("assigned_driver")}
                  onValueChange={(val) => setValue("assigned_driver", val)}
                  options={[
                    { value: "", label: "غير معين (سائق نوبة)" },
                    ...members.map((m) => ({
                      value: String(m.id),
                      label: `${m.full_name} (${m.force_number || "بدون رقم"})`,
                    })),
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Weapon Attachment */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
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
              <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 text-caption font-semibold">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span>بيانات التسليح وتبعية السلاح (منفصلة عن تبعية المركبة)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="mounted_weapon_name" className="text-label text-slate-800 dark:text-slate-200">اسم / نوع السلاح المثبت *</Label>
                    <Input
                      id="mounted_weapon_name"
                      placeholder="مثال: رشاش دوشكا 12.7 مم / رشاش 14.5"
                      {...register("mounted_weapon_name", {
                        required: hasWeapon ? "اسم السلاح مطلوب عند التفعيل" : false,
                      })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mounted_weapon_serial" className="text-label text-slate-800 dark:text-slate-200">رقم السلاح التسلسلي *</Label>
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

                  <div className="space-y-1.5">
                    <Label htmlFor="weapon_faction" className="text-label text-slate-800 dark:text-slate-200">فصيل / قسم تبعية السلاح</Label>
                    <Select
                      value={watch("weapon_faction")}
                      onValueChange={(val) => setValue("weapon_faction", val)}
                      options={[
                        { value: "", label: "نفس فصيل المركبة" },
                        ...factions.map((f) => ({ value: String(f.id), label: f.name_ar })),
                      ]}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="weapon_assigned_member" className="text-label text-slate-800 dark:text-slate-200">الرامي المكلف بالسلاح</Label>
                    <Select
                      value={watch("weapon_assigned_member")}
                      onValueChange={(val) => setValue("weapon_assigned_member", val)}
                      options={[
                        { value: "", label: "غير معين (رامي نوبة)" },
                        ...members.map((m) => ({
                          value: String(m.id),
                          label: `${m.full_name} (${m.force_number || "بدون رقم"})`,
                        })),
                      ]}
                    />
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
              placeholder="أي تفاصيل فنية، حالة الإطارات، أو تجهيزات خاصة..."
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isEdit ? "حفظ التعديلات" : "إضافة المركبة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
