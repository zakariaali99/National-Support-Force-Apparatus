import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/Dialog";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { PageHeader } from "../../components/ui/PageHeader";
import { Switch } from "../../components/ui/Switch";
import { Textarea } from "../../components/ui/Textarea";
import { showToast } from "../../components/ui/Toast";
import { useAuth } from "../auth/AuthContext";
import { factionsApi } from "./api";

const schema = z.object({
  name_ar: z.string().min(1, "اسم الإدارة مطلوب"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

export function FactionsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("structure.manage");

  const { data: factions = [], isLoading } = factionsApi.useList();
  const createMutation = factionsApi.useCreate();
  const updateMutation = factionsApi.useUpdate();
  const deleteMutation = factionsApi.useDelete();

  // 'create' | { edit: Faction } | null
  const [dialogState, setDialogState] = useState(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name_ar: "", description: "", is_active: true },
  });

  function openCreate() {
    form.reset({ name_ar: "", description: "", is_active: true });
    setDialogState("create");
  }

  function openEdit(faction) {
    form.reset({
      name_ar: faction.name_ar,
      description: faction.description || "",
      is_active: faction.is_active,
    });
    setDialogState({ edit: faction });
  }

  async function onSubmit(values) {
    try {
      if (dialogState === "create") {
        await createMutation.mutateAsync(values);
        showToast("تمت إضافة الإدارة بنجاح", "success");
      } else if (dialogState?.edit) {
        await updateMutation.mutateAsync({
          id: dialogState.edit.id,
          payload: values,
        });
        showToast("تم تحديث الإدارة بنجاح", "success");
      }
      setDialogState(null);
    } catch {
      showToast("حدث خطأ أثناء الحفظ", "error");
    }
  }

  async function handleDelete(faction) {
    if (window.confirm(`هل تريد حذف الإدارة "${faction.name_ar}"؟`)) {
      try {
        await deleteMutation.mutateAsync(faction.id);
        showToast("تم حذف الإدارة", "success");
      } catch {
        showToast("تعذر حذف الإدارة", "error");
      }
    }
  }

  const columns = [
    { key: "name_ar", label: "اسم الإدارة" },
    {
      key: "description",
      label: "الوصف والمهام",
      render: (r) => r.description || "—",
    },
    {
      key: "status",
      label: "الحالة",
      render: (r) => (
        <Badge variant={r.is_active ? "success" : "muted"}>
          {r.is_active ? "نشط" : "غير نشط"}
        </Badge>
      ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            label: "إجراءات",
            className: "text-center w-24",
            render: (r) => (
              <div className="flex items-center justify-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-danger hover:bg-danger/10"
                  onClick={() => handleDelete(r)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="إدارات وقطاعات الجهاز" description="الأقسام والإدارات التنفيذية التي ينتمي إليها أعضاء القوة المساندة.">
        {canManage && (
          <Button onClick={openCreate} size="sm" className="shadow-xs font-bold">
            <Plus className="h-4 w-4 me-1.5" />
            إضافة إدارة جديدة
          </Button>
        )}
      </PageHeader>

      <Card className="rounded-2xl border border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-hidden">
          <DataTable columns={columns} rows={factions} isLoading={isLoading} emptyMessage="لا توجد إدارات مسجلة بعد" />
        </CardContent>
      </Card>

      <Dialog open={Boolean(dialogState)} onOpenChange={(open) => !open && setDialogState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState === "create" ? "إضافة إدارة جديدة" : "تعديل بيانات الإدارة"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="faction-name">اسم الإدارة</Label>
              <Input id="faction-name" placeholder="اسم الإدارة بالعربية..." {...form.register("name_ar")} />
              {form.formState.errors.name_ar && (
                <p className="text-caption text-destructive">{form.formState.errors.name_ar.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="faction-description">الوصف والمهام الفرعية</Label>
              <Textarea id="faction-description" placeholder="اختياري..." {...form.register("description")} />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="faction-active">تفعيل الإدارة في النظام</Label>
              <Switch
                id="faction-active"
                checked={form.watch("is_active")}
                onCheckedChange={(value) => form.setValue("is_active", value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogState(null)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="font-bold">
                حفظ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FactionsPage;
