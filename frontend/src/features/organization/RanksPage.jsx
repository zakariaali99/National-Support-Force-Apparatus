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
    if (dialogState === "create") {
      const code = generateSlug(values.name_ar);
      await createRank.mutateAsync({ ...values, code });
    } else {
      const code = dialogState.code || generateSlug(values.name_ar);
      await updateRank.mutateAsync({ id: dialogState.id, ...values, code });
    }
    setDialogState(null);
  }

  async function onDelete(rank) {
    if (window.confirm(`هل تريد حذف الرتبة "${rank.name_ar}"؟`)) {
      await removeRank.mutateAsync(rank.id);
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

      <Card className="rounded-2xl border border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-hidden">
          <DataTable columns={columns} rows={ranks} isLoading={isLoading} emptyMessage="لا توجد رتب مسجلة بعد" />
        </CardContent>
      </Card>

      <Dialog open={Boolean(dialogState)} onOpenChange={(open) => !open && setDialogState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState === "create" ? "إضافة رتبة جديدة" : "تعديل بيانات الرتبة"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rank-name">اسم الرتبة</Label>
              <Input id="rank-name" placeholder="مثال: ملازم أول، عميد، ..." {...form.register("name_ar")} />
              {form.formState.errors.name_ar && (
                <p className="text-caption text-destructive">{form.formState.errors.name_ar.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rank-order">رقم الترتيب التسلسلي</Label>
              <Input id="rank-order" type="number" {...form.register("order")} />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="rank-active">تفعيل الرتبة للنظام</Label>
              <Switch
                id="rank-active"
                checked={form.watch("is_active")}
                onCheckedChange={(value) => form.setValue("is_active", value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogState(null)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                حفظ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
