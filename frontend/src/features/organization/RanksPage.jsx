import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/Dialog";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { PageHeader } from "../../components/ui/PageHeader";
import { Switch } from "../../components/ui/Switch";
import { useAuth } from "../auth/AuthContext";
import { ranksApi } from "./api";

const schema = z.object({
  name_ar: z.string().min(1, "الاسم مطلوب"),
  order: z.coerce.number().int().min(0),
  is_active: z.boolean(),
});

function generateSlug(text) {
  return (
    text
      .toLowerCase()
      .replace(/[\s\W]+/g, "-")
      .replace(/^-+|-+$/g, "") || `rank-${Date.now()}`
  );
}

export function RanksPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("organization.manage");

  const { data: ranks = [], isLoading } = ranksApi.useList({ ordering: "order" });
  const createRank = ranksApi.useCreate();
  const updateRank = ranksApi.useUpdate();
  const removeRank = ranksApi.useRemove();

  const [dialogState, setDialogState] = useState(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name_ar: "", order: 0, is_active: true },
  });

  function openCreate() {
    form.reset({ name_ar: "", order: ranks.length, is_active: true });
    setDialogState("create");
  }

  function openEdit(rank) {
    form.reset({
      name_ar: rank.name_ar,
      order: rank.order,
      is_active: rank.is_active,
    });
    setDialogState(rank);
  }

  async function onSubmit(values) {
    try {
      if (dialogState === "create") {
        const code = generateSlug(values.name_ar);
        await createRank.mutateAsync({ ...values, code });
        showToast("تمت إضافة الرتبة بنجاح", "success");
      } else {
        const code = dialogState.code || generateSlug(values.name_ar);
        await updateRank.mutateAsync({ id: dialogState.id, ...values, code });
        showToast("تم تحديث الرتبة بنجاح", "success");
      }
      setDialogState(null);
    } catch (err) {
      const serverMsg =
        err?.response?.data?.detail ||
        (typeof err?.response?.data === "object"
          ? Object.entries(err.response.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : null) ||
        "حدث خطأ أثناء حفظ الرتبة";
      showToast(serverMsg, "error");
    }
  }

  async function onDelete(rank) {
    if (window.confirm(`هل تريد حذف الرتبة "${rank.name_ar}"؟`)) {
      try {
        await removeRank.mutateAsync(rank.id);
        showToast("تم حذف الرتبة بنجاح", "success");
      } catch (err) {
        const serverMsg =
          err?.response?.data?.detail ||
          (typeof err?.response?.data === "object"
            ? Object.values(err.response.data).flat().join(" - ")
            : null) ||
          "تعذر حذف الرتبة";
        showToast(serverMsg, "error");
      }
    }
  }

  const columns = [
    { key: "name_ar", label: "اسم الرتبة" },
    { key: "order", label: "الترتيب القياسي" },
    {
      key: "is_active",
      label: "الحالة",
      render: (row) => (
        <span className={row.is_active ? "text-success font-bold" : "text-muted-foreground"}>
          {row.is_active ? "مفعّلة" : "معطّلة"}
        </span>
      ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            label: "",
            render: (row) => (
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="تعديل">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(row)} aria-label="حذف">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="رتب القوة" description="إدارة الرتب التسلسلية لأعضاء الجهاز الوطني.">
        {canManage && (
          <Button onClick={openCreate} size="sm" className="shadow-xs">
            <Plus className="h-4 w-4 me-1.5" />
            إضافة رتبة
          </Button>
        )}
      </PageHeader>

      <Card className="rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-hidden">
          <DataTable columns={columns} rows={ranks} isLoading={isLoading} emptyMessage="لا توجد رتب مسجلة بعد" />
        </CardContent>
      </Card>

      <Dialog open={Boolean(dialogState)} onOpenChange={(open) => !open && setDialogState(null)}>
        <DialogContent className="max-w-xl p-6 rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038]">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-white/10">
            <DialogTitle className="text-title font-bold text-slate-900 dark:text-white">
              {dialogState === "create" ? "إضافة رتبة عسكرية جديدة" : "تعديل بيانات الرتبة"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="rank-name" className="text-label font-bold text-slate-800 dark:text-slate-200">
                اسم الرتبة العسكرية <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="rank-name"
                placeholder="مثال: جندي، عريف، ملازم، نقيب، رائد..."
                className="rounded-2xl"
                {...form.register("name_ar")}
              />
              {form.formState.errors.name_ar && (
                <p className="text-caption text-rose-600 font-bold">{form.formState.errors.name_ar.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rank-order" className="text-label font-bold text-slate-800 dark:text-slate-200">
                الترتيب والأسبقية العسكرية
              </Label>
              <Input
                id="rank-order"
                type="number"
                placeholder="1, 2, 3..."
                className="rounded-2xl"
                {...form.register("order")}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
              <Label htmlFor="rank-active" className="text-caption font-bold text-slate-800 dark:text-slate-200">
                تفعيل الرتبة واستخدامها في النظام
              </Label>
              <Switch
                id="rank-active"
                checked={form.watch("is_active")}
                onCheckedChange={(value) => form.setValue("is_active", value)}
              />
            </div>
            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogState(null)} className="rounded-xl">
                إلغاء
              </Button>
              <Button type="submit" variant="primary" disabled={form.formState.isSubmitting} className="rounded-xl font-bold">
                حفظ البيانات
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RanksPage;
