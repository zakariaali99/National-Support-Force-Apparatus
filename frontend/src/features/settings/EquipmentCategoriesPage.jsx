import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Shield, Layers } from "lucide-react";
import { useForm } from "react-hook-form";

import { api } from "../../lib/api";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { Badge } from "../../components/ui/Badge";
import { showToast } from "../../components/ui/Toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/Dialog";
import { DataTable } from "../../components/ui/DataTable";

const CATEGORY_TYPE_LABELS = {
  rifle: "بندقية / سلاح خفيف",
  pistol: "مسدس",
  machine_gun: "رشاش / سلاح متوسط",
  ammo: "ذخيرة",
  armor: "عتاد وتجهيزات شخصية",
  other: "أخرى",
};

export function EquipmentCategoriesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { name_ar: "", category_type: "rifle", description: "" },
  });

  const { data: rawCategories = [], isLoading } = useQuery({
    queryKey: ["equipment-categories"],
    queryFn: async () => (await api.get("equipment/categories/")).data,
  });
  const categories = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.results ?? []);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingCategory) {
        return (await api.put(`equipment/categories/${editingCategory.id}/`, data)).data;
      }
      return (await api.post("equipment/categories/", data)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["equipment-categories"]);
      showToast(editingCategory ? "تم تحديث التصنيف بنجاح" : "تم إضافة التصنيف بنجاح", "success");
      setDialogOpen(false);
      setEditingCategory(null);
      reset();
    },
    onError: () => showToast("تعذر حفظ التصنيف", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`equipment/categories/${id}/`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries(["equipment-categories"]);
      showToast("تم حذف التصنيف بنجاح", "success");
    },
    onError: () => showToast("تعذر حذف التصنيف", "error"),
  });

  function handleOpenCreate() {
    setEditingCategory(null);
    reset({ name_ar: "", category_type: "rifle", description: "" });
    setDialogOpen(true);
  }

  function handleOpenEdit(cat) {
    setEditingCategory(cat);
    setValue("name_ar", cat.name_ar);
    setValue("category_type", cat.category_type || "rifle");
    setValue("description", cat.description || "");
    setDialogOpen(true);
  }

  function handleDelete(cat) {
    if (window.confirm(`هل أنت تأكد من حذف التصنيف "${cat.name_ar}"؟`)) {
      deleteMutation.mutate(cat.id);
    }
  }

  const columns = [
    { key: "name_ar", label: "اسم التصنيف" },
    {
      key: "category_type",
      label: "النوع الرئيسي",
      render: (row) => (
        <Badge variant="secondary">
          {CATEGORY_TYPE_LABELS[row.category_type] || row.category_type || "عام"}
        </Badge>
      ),
    },
    { key: "description", label: "الوصف", render: (row) => row.description || "—" },
    {
      key: "actions",
      label: "الإجراءات",
      className: "text-center w-28",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(row)} title="تعديل">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => handleDelete(row)} title="حذف">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة تصنيفات العتاد والأسلحة"
        description="ضبط وتحديد فئات وتصنيفات الأسلحة والذخائر والعتاد المستخدمة بالجرد."
        actions={
          <Button onClick={handleOpenCreate} className="font-bold shadow-xs">
            <Plus className="h-4 w-4 me-1.5" />
            إضافة تصنيف جديد
          </Button>
        }
      />

      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/60">
          <CardTitle className="text-body font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <span>قائمة تصنيفات العتاد والجرد</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} rows={categories} isLoading={isLoading} emptyMessage="لا توجد تصنيفات عتاد مسجلة بعد" />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "تعديل تصنيف العتاد" : "إضافة تصنيف عتاد جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label required>اسم التصنيف (بالعربية)</Label>
              <Input placeholder="مثال: أسلحة خفيفة فردية" {...register("name_ar", { required: true })} required />
            </div>

            <div className="space-y-1.5">
              <Label required>النوع الرئيسي</Label>
              <Select {...register("category_type")}>
                {Object.entries(CATEGORY_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>الوصف / الملاحظات</Label>
              <Textarea placeholder="وصف مقتضب عن هذا التصنيف..." {...register("description")} />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="font-bold">
                {editingCategory ? "حفظ التعديلات" : "إضافة التصنيف"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EquipmentCategoriesPage;
