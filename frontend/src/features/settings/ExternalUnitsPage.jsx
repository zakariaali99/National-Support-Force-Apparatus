import { useState, useMemo } from "react";
import { Building2, Plus, Pencil, Trash2, Search, Car, Phone, User, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";

import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Textarea } from "../../components/ui/Textarea";
import { Switch } from "../../components/ui/Switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/Dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/AlertDialog";
import {
  useExternalUnits,
  useCreateExternalUnit,
  useUpdateExternalUnit,
  useDeleteExternalUnit,
} from "../transportation/api";

export function ExternalUnitsPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [deletingUnit, setDeletingUnit] = useState(null);

  const { data: units = [], isLoading } = useExternalUnits();
  const createUnit = useCreateExternalUnit();
  const updateUnit = useUpdateExternalUnit();
  const deleteUnit = useDeleteExternalUnit();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name_ar: "",
      commander_name: "",
      phone: "",
      notes: "",
      is_active: true,
    },
  });

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        u.name_ar?.toLowerCase().includes(s) ||
        u.commander_name?.toLowerCase().includes(s) ||
        u.phone?.includes(s) ||
        u.notes?.toLowerCase().includes(s)
      );
    });
  }, [units, search]);

  function handleOpenCreate() {
    setEditingUnit(null);
    reset({
      name_ar: "",
      commander_name: "",
      phone: "",
      notes: "",
      is_active: true,
    });
    setFormOpen(true);
  }

  function handleOpenEdit(unit) {
    setEditingUnit(unit);
    reset({
      name_ar: unit.name_ar,
      commander_name: unit.commander_name || "",
      phone: unit.phone || "",
      notes: unit.notes || "",
      is_active: unit.is_active,
    });
    setFormOpen(true);
  }

  async function onSubmit(data) {
    if (editingUnit) {
      await updateUnit.mutateAsync({ id: editingUnit.id, ...data });
    } else {
      await createUnit.mutateAsync(data);
    }
    setFormOpen(false);
    reset();
  }

  async function handleDelete() {
    if (!deletingUnit) return;
    await deleteUnit.mutateAsync(deletingUnit.id);
    setDeletingUnit(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="الوحدات والجهات الخارجية"
        subtitle="إدارة وتوثيق الوحدات والكتائب والأجهزة الخارجية التابعة لها المركبات أو المعارة إليها"
        action={
          <Button onClick={handleOpenCreate} className="gap-2 font-bold shadow-sm">
            <Plus className="h-4.5 w-4.5" />
            إضافة جهة/وحدة جديدة
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] shadow-xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-caption text-slate-500 dark:text-gray-400 font-bold">إجمالي الجهات الخارجية</p>
              <p className="text-title font-bold text-slate-900 dark:text-white mt-0.5">{units.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] shadow-xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-caption text-slate-500 dark:text-gray-400 font-bold">الجهات النشطة</p>
              <p className="text-title font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {units.filter((u) => u.is_active).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] shadow-xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <p className="text-caption text-slate-500 dark:text-gray-400 font-bold">مركبات بتبعية خارجية</p>
              <p className="text-title font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {units.reduce((acc, u) => acc + (u.vehicles_count || 0), 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] shadow-xs">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="بحث في أسماء الوحدات أو المسؤولين..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9 h-10 rounded-xl"
              />
            </div>
            <p className="text-caption text-slate-500 dark:text-gray-400 font-medium">
              العدد الإجمالي: <span className="font-bold text-slate-900 dark:text-white">{filteredUnits.length}</span> جهة
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
            <table className="w-full text-start text-body-sm">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-gray-300 font-bold">
                <tr>
                  <th className="py-3.5 px-4 text-start">اسم الوحدة / الجهة الخارجية</th>
                  <th className="py-3.5 px-4 text-start">آمر الوحدة / مسؤول التنسيق</th>
                  <th className="py-3.5 px-4 text-start">رقم الهاتف</th>
                  <th className="py-3.5 px-4 text-center">المركبات التابعة</th>
                  <th className="py-3.5 px-4 text-center">الحالة</th>
                  <th className="py-3.5 px-4 text-end">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                      جارٍ تحميل الوحدات الخارجية...
                    </td>
                  </tr>
                ) : filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                      لا توجد جهات أو وحدات خارجية مسجلة تطابق البحث.
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map((unit) => (
                    <tr key={unit.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p>{unit.name_ar}</p>
                            {unit.notes && (
                              <p className="text-caption text-slate-400 font-normal truncate max-w-xs">{unit.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-gray-300">
                        {unit.commander_name ? (
                          <div className="flex items-center gap-1.5 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{unit.commander_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-gray-300 dir-ltr text-end font-mono">
                        {unit.phone ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span>{unit.phone}</span>
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="secondary" className="gap-1 font-bold">
                          <Car className="w-3 h-3 text-slate-500" />
                          {unit.vehicles_count || 0} مركبة
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={unit.is_active ? "success" : "secondary"}>
                          {unit.is_active ? "نشطة" : "معطلة"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(unit)}
                            className="h-8 px-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg gap-1 font-bold"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingUnit(unit)}
                            className="h-8 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg gap-1 font-bold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            حذف
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg rounded-[28px] p-6 text-start">
          <DialogHeader>
            <DialogTitle className="text-title font-bold text-slate-900 dark:text-white">
              {editingUnit ? "تعديل بيانات الوحدة / الجهة الخارجية" : "إضافة وحدة / جهة خارجية جديدة"}
            </DialogTitle>
            <DialogDescription className="text-caption text-slate-500">
              أدخل البيانات الرسمية للجهة الخارجية لاعتمادها في تبعية المركبات والأسطول
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-caption font-bold text-slate-700 dark:text-gray-300">
                اسم الوحدة / الجهة الخارجية <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="مثال: اللواء 444 قتال، جهاز دعم الاستقرار..."
                {...register("name_ar", { required: "اسم الوحدة مطلوب" })}
                className="h-10 rounded-xl"
              />
              {errors.name_ar && (
                <p className="text-caption text-rose-500">{errors.name_ar.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-caption font-bold text-slate-700 dark:text-gray-300">
                  آمر الوحدة / مسؤول التنسيق
                </label>
                <Input
                  placeholder="مثال: عقيد / فلان الفلاني"
                  {...register("commander_name")}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-caption font-bold text-slate-700 dark:text-gray-300">
                  رقم الهاتف للتواصل
                </label>
                <Input
                  placeholder="091XXXXXXX"
                  {...register("phone")}
                  className="h-10 rounded-xl dir-ltr text-end font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-caption font-bold text-slate-700 dark:text-gray-300">
                ملاحظات أو قرار التبعية والإعارة
              </label>
              <Textarea
                placeholder="أي تفاصيل عن مدة الإعارة أو المرجعية الإدارية..."
                {...register("notes")}
                rows={3}
                className="rounded-xl resize-none text-body-sm"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
              <div className="space-y-0.5">
                <p className="text-body-sm font-bold text-slate-900 dark:text-white">حالة الوحدة</p>
                <p className="text-caption text-slate-500">تمكين اختيار هذه الوحدة في تبعية المركبات</p>
              </div>
              <Switch
                checked={watch("is_active")}
                onCheckedChange={(val) => setValue("is_active", val)}
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl px-5 font-bold">
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl px-6 font-bold">
                {isSubmitting ? "جارٍ الحفظ..." : editingUnit ? "حفظ التعديلات" : "إضافة الجهة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={Boolean(deletingUnit)} onOpenChange={(open) => !open && setDeletingUnit(null)}>
        <AlertDialogContent className="max-w-md rounded-[28px] text-start">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-title font-bold text-rose-600">
              تأكيد حذف الجهة الخارجية
            </AlertDialogTitle>
            <AlertDialogDescription className="text-body-sm text-slate-600 dark:text-gray-300">
              هل أنت متأكد من حذف سجل الجهة <strong className="text-slate-900 dark:text-white">({deletingUnit?.name_ar})</strong>؟ لن يتم حذف المركبات المرتبطة بها وإنما سيتم فك الارتباط.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex items-center justify-end gap-2">
            <AlertDialogCancel className="rounded-xl font-bold">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-rose-600 hover:bg-rose-700 font-bold">
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ExternalUnitsPage;
