import { useState, useMemo } from "react";
import { Crosshair, Plus, Pencil, Trash2, Search, Shield, Zap, Package } from "lucide-react";
import { useForm } from "react-hook-form";

import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Textarea } from "../../components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select";
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
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../inventory/api";

const WEAPON_TYPE_OPTIONS = [
  { value: "rifle", label: "بندقية / سلاح خفيف هجومي" },
  { value: "pistol", label: "مسدس / فردي" },
  { value: "machine_gun", label: "رشاش متوسط / ثقيل / سلاح مصفحة" },
  { value: "ammo", label: "ذخائر ومقذوفات" },
  { value: "armor", label: "مناظير وتجهيزات تسليح" },
  { value: "other", label: "أخرى" },
];

export function ArmoryCategoriesPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [deletingCat, setDeletingCat] = useState(null);

  const { data: categories = [], isLoading } = useCategories({ domain: "armory" });
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

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
      category_type: "rifle",
      description: "",
      domain: "armory",
    },
  });

  const filteredCategories = useMemo(() => {
    return (categories || []).filter((c) => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        c.name_ar?.toLowerCase().includes(s) ||
        c.description?.toLowerCase().includes(s) ||
        c.category_type_display?.toLowerCase().includes(s)
      );
    });
  }, [categories, search]);

  function handleOpenCreate() {
    setEditingCat(null);
    reset({
      name_ar: "",
      category_type: "rifle",
      description: "",
      domain: "armory",
    });
    setFormOpen(true);
  }

  function handleOpenEdit(cat) {
    setEditingCat(cat);
    reset({
      name_ar: cat.name_ar,
      category_type: cat.category_type || "rifle",
      description: cat.description || "",
      domain: "armory",
    });
    setFormOpen(true);
  }

  async function onSubmit(data) {
    const payload = { ...data, domain: "armory" };
    if (editingCat) {
      await updateCategory.mutateAsync({ id: editingCat.id, ...payload });
    } else {
      await createCategory.mutateAsync(payload);
    }
    setFormOpen(false);
    reset();
  }

  async function handleDelete() {
    if (!deletingCat) return;
    await deleteCategory.mutateAsync(deletingCat.id);
    setDeletingCat(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="تصنيفات وأنواع التسليح"
        subtitle="إدارة وتخصيص فئات الأسلحة والذخائر والمقذوفات لتسهيل الإدخال والجرد في قسم التسليح"
        action={
          <Button onClick={handleOpenCreate} className="gap-2 font-bold shadow-sm">
            <Plus className="h-4.5 w-4.5" />
            إضافة تصنيف تسليح جديد
          </Button>
        }
      />

      {/* Main Table Card */}
      <Card className="border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] shadow-xs">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="بحث في تصنيفات الأسلحة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9 h-10 rounded-xl"
              />
            </div>
            <p className="text-caption text-slate-500 dark:text-gray-400 font-medium">
              العدد الإجمالي: <span className="font-bold text-slate-900 dark:text-white">{filteredCategories.length}</span> تصنيف
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
            <table className="w-full text-start text-body-sm table-auto">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-gray-300 font-bold">
                <tr>
                  <th className="py-3.5 px-4 text-start">اسم تصنيف التسليح</th>
                  <th className="py-3.5 px-4 text-start">النوع القياسي</th>
                  <th className="py-3.5 px-4 text-start">الوصف والمواصفة</th>
                  <th className="py-3.5 px-4 text-center">القطع المسجلة</th>
                  <th className="py-3.5 px-4 text-end">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                      جارٍ تحميل تصنيفات التسليح...
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                      لا توجد تصنيفات تسليح مسجلة تطابق البحث.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Crosshair className="w-4 h-4" />
                          </div>
                          <span>{cat.name_ar}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="primary" className="font-bold">
                          {cat.category_type_display || cat.category_type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-gray-300 font-medium">
                        {cat.description || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="secondary" className="gap-1 font-bold">
                          <Package className="w-3 h-3 text-slate-500" />
                          {cat.items_count || 0} قطعة
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(cat)}
                            className="h-8 px-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg gap-1 font-bold"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingCat(cat)}
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
        <DialogContent className="max-w-md rounded-[28px] p-6 text-start">
          <DialogHeader>
            <DialogTitle className="text-title font-bold text-slate-900 dark:text-white">
              {editingCat ? "تعديل تصنيف تسليح" : "إضافة تصنيف تسليح جديد"}
            </DialogTitle>
            <DialogDescription className="text-caption text-slate-500">
              حدد اسم ونوع الفئة لتظهر كخيار متاح عند إضافة الأسلحة والذخائر
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-caption font-bold text-slate-700 dark:text-gray-300">
                اسم تصنيف التسليح <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="مثال: بنادق قنص، رشاشات ثقيلة، ذخائر 7.62..."
                {...register("name_ar", { required: "اسم التصنيف مطلوب" })}
                className="h-10 rounded-xl"
              />
              {errors.name_ar && (
                <p className="text-caption text-rose-500">{errors.name_ar.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-caption font-bold text-slate-700 dark:text-gray-300">
                النوع القياسي في المنظومة <span className="text-rose-500">*</span>
              </label>
              <Select
                value={watch("category_type")}
                onValueChange={(val) => setValue("category_type", val)}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  {WEAPON_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-caption font-bold text-slate-700 dark:text-gray-300">
                الوصف والملاحظات
              </label>
              <Textarea
                placeholder="تفاصيل إضافية عن نوعية الأسلحة أو الأعيرة التابعة لهذا التصنيف..."
                {...register("description")}
                rows={3}
                className="rounded-xl resize-none text-body-sm"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl px-5 font-bold">
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl px-6 font-bold">
                {isSubmitting ? "جارٍ الحفظ..." : editingCat ? "حفظ التعديلات" : "إضافة التصنيف"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={Boolean(deletingCat)} onOpenChange={(open) => !open && setDeletingCat(null)}>
        <AlertDialogContent className="max-w-md rounded-[28px] text-start">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-title font-bold text-rose-600">
              تأكيد حذف تصنيف التسليح
            </AlertDialogTitle>
            <AlertDialogDescription className="text-body-sm text-slate-600 dark:text-gray-300">
              هل أنت متأكد من حذف تصنيف التسليح <strong className="text-slate-900 dark:text-white">({deletingCat?.name_ar})</strong>؟ لن يتم الحذف إذا كانت هناك أسلحة مسجلة تحته.
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

export default ArmoryCategoriesPage;
