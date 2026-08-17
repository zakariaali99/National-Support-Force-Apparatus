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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-title text-navy">
            <Car className="w-5 h-5 text-gold-dark" />
            {isEdit ? "تعديل بيانات المركبة" : "إضافة مركبة / آلية جديدة"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          {/* Section 1: Vehicle Base Details */}
          <div className="space-y-4 rounded-lg border border-line bg-surface p-4">
            <div className="flex items-center gap-2 border-b border-line/60 pb-2 text-section text-navy font-semibold">
              <Car className="w-4 h-4 text-gold-dark" />
              <span>بيانات الآلية والمركبة</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-label text-navy">اسم / طراز المركبة *</Label>
                <Input
                  id="name"
                  placeholder="مثال: تويوتا لاندكروزر LC79"
                  {...register("name", { required: "اسم المركبة مطلوب" })}
                />
                {errors.name && <p className="text-caption text-danger">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vehicle_type" className="text-label text-navy">نوع الآلية *</Label>
                <Select
                  value={watch("vehicle_type")}
                  onValueChange={(val) => setValue("vehicle_type", val)}
                  options={VEHICLE_TYPES}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vin_number" className="text-label text-navy">رقم الهيكل (VIN / Chassis) *</Label>
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
                <Label htmlFor="plate_number" className="text-label text-navy">رقم اللوحة العسكرية / المدنية</Label>
                <Input
                  id="plate_number"
                  placeholder="مثال: 10-12345"
                  dir="ltr"
                  className="font-mono"
                  {...register("plate_number")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="model_year" className="text-label text-navy">سنة الصنع</Label>
                <Input
                  id="model_year"
                  placeholder="مثال: 2024"
                  dir="ltr"
                  {...register("model_year")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="color" className="text-label text-navy">اللون</Label>
                <Input
                  id="color"
                  placeholder="مثال: بيج عسكري / أسود"
                  {...register("color")}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="status" className="text-label text-navy">الحالة التشغيلية</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(val) => setValue("status", val)}
                  options={VEHICLE_STATUSES}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle Affiliation & Driver */}
          <div className="space-y-4 rounded-lg border border-line bg-surface p-4">
            <div className="flex items-center gap-2 border-b border-line/60 pb-2 text-section text-navy font-semibold">
              <UserCheck className="w-4 h-4 text-gold-dark" />
              <span>تبعية المركبة والسائق</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="faction" className="text-label text-navy">الفصيل / القسم التابعة له المركبة</Label>
                <Select
                  value={watch("faction") || "none"}
                  onValueChange={(val) => setValue("faction", val === "none" ? "" : val)}
                  options={[
                    { value: "none", label: "— بدون تخصيص فصيل —" },
                    ...factions.map((f) => ({ value: String(f.id), label: f.name_ar })),
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assigned_driver" className="text-label text-navy">السائق أو المسؤول عن المركبة</Label>
                <Select
                  value={watch("assigned_driver") || "none"}
                  onValueChange={(val) => setValue("assigned_driver", val === "none" ? "" : val)}
                  options={[
                    { value: "none", label: "— بدون سائق محدد —" },
                    ...members.map((m) => ({
                      value: String(m.id),
                      label: `${m.full_name} (${m.force_number || "بدون رقم"})`,
                    })),
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Mounted Weapon Details (Independent Affiliation) */}
          <div className="space-y-4 rounded-lg border border-line bg-surface p-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2 text-section text-navy font-semibold">
                <Crosshair className="w-4 h-4 text-gold-dark" />
                <span>السلاح المثبت على المركبة (قسم التسليح)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-body-sm text-navy-muted">هل تملك سلاحاً؟</span>
                <Switch
                  checked={hasWeapon}
                  onCheckedChange={(checked) => setValue("has_weapon", checked)}
                />
              </div>
            </div>

            {hasWeapon && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                <div className="p-3 bg-gold-bg/40 border border-gold-border/60 rounded-md text-caption text-navy flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-gold-dark mt-0.5 shrink-0" />
                  <span>
                    ملاحظة إدارية: يتم تسجيل تبعية السلاح ومسؤول السلاح بشكل مستقل تماماً عن تبعية المركبة وسائقها.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="mounted_weapon_name" className="text-label text-navy">اسم / عيار السلاح المثبت *</Label>
                    <Input
                      id="mounted_weapon_name"
                      placeholder="مثال: دوشكا 12.7 مم / بيكاسي 7.62"
                      {...register("mounted_weapon_name", {
                        required: hasWeapon ? "اسم السلاح مطلوب عند التثبيت" : false,
                      })}
                    />
                    {errors.mounted_weapon_name && (
                      <p className="text-caption text-danger">{errors.mounted_weapon_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mounted_weapon_serial" className="text-label text-navy">رقم السلاح (الرقم التسلسلي)</Label>
                    <Input
                      id="mounted_weapon_serial"
                      placeholder="مثال: DSHK-88992"
                      dir="ltr"
                      className="font-mono"
                      {...register("mounted_weapon_serial")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="weapon_faction" className="text-label text-navy">تبعية السلاح الفصائلية</Label>
                    <Select
                      value={watch("weapon_faction") || "none"}
                      onValueChange={(val) => setValue("weapon_faction", val === "none" ? "" : val)}
                      options={[
                        { value: "none", label: "— بدون تخصيص فصيل للسلاح —" },
                        ...factions.map((f) => ({ value: String(f.id), label: f.name_ar })),
                      ]}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="weapon_assigned_member" className="text-label text-navy">الرامي / المسؤول عن السلاح</Label>
                    <Select
                      value={watch("weapon_assigned_member") || "none"}
                      onValueChange={(val) => setValue("weapon_assigned_member", val === "none" ? "" : val)}
                      options={[
                        { value: "none", label: "— بدون رامٍ مخصص —" },
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
            <Label htmlFor="notes" className="text-label text-navy">ملاحظات إضافية</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="أي ملاحظات فنية أو تجهيزات خاصة..."
              {...register("notes")}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-line">
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
