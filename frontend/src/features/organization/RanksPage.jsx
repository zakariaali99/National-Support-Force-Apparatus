import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/Dialog";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Switch } from "../../components/ui/Switch";
import { useAuth } from "../auth/AuthContext";
import { ranksApi } from "./api";

const schema = z.object({
  code: z
    .string()
    .min(1, "الرمز مطلوب")
    .regex(/^[a-z0-9-]+$/, "أحرف إنجليزية صغيرة وأرقام وشرطات فقط"),
  name_ar: z.string().min(1, "الاسم مطلوب"),
  order: z.coerce.number().int().min(0),
  is_active: z.boolean(),
});

export function RanksPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("organization.manage");

  const { data: ranks = [], isLoading } = ranksApi.useList({ ordering: "order" });
  const createRank = ranksApi.useCreate();
  const updateRank = ranksApi.useUpdate();
  const removeRank = ranksApi.useRemove();

  // null = closed, "create" = create mode, a rank object = editing that rank
  const [dialogState, setDialogState] = useState(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: "", name_ar: "", order: 0, is_active: true },
  });

  function openCreate() {
    form.reset({ code: "", name_ar: "", order: ranks.length, is_active: true });
    setDialogState("create");
  }

  function openEdit(rank) {
    form.reset({
      code: rank.code,
      name_ar: rank.name_ar,
      order: rank.order,
      is_active: rank.is_active,
    });
    setDialogState(rank);
  }

  async function onSubmit(values) {
    if (dialogState === "create") {
      await createRank.mutateAsync(values);
    } else {
      await updateRank.mutateAsync({ id: dialogState.id, ...values });
    }
    setDialogState(null);
  }

  async function onDelete(rank) {
    if (window.confirm(`هل تريد حذف الرتبة "${rank.name_ar}"؟`)) {
      await removeRank.mutateAsync(rank.id);
    }
  }

  const columns = [
    { key: "name_ar", label: "الاسم" },
    { key: "code", label: "الرمز" },
    { key: "order", label: "الترتيب" },
    {
      key: "is_active",
      label: "الحالة",
      render: (row) => (
        <span className={row.is_active ? "text-success" : "text-muted-foreground"}>
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
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>الرتب</CardTitle>
            <CardDescription>الرتب المتاحة لأعضاء الجهاز</CardDescription>
          </div>
          {canManage && (
            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4" />
              إضافة رتبة
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} rows={ranks} isLoading={isLoading} emptyMessage="لا توجد رتب بعد" />
        </CardContent>
      </Card>

      <Dialog open={Boolean(dialogState)} onOpenChange={(open) => !open && setDialogState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState === "create" ? "إضافة رتبة" : "تعديل الرتبة"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rank-name">الاسم</Label>
              <Input id="rank-name" {...form.register("name_ar")} />
              {form.formState.errors.name_ar && (
                <p className="text-xs text-destructive">{form.formState.errors.name_ar.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rank-code">الرمز</Label>
              <Input id="rank-code" dir="ltr" {...form.register("code")} />
              {form.formState.errors.code && (
                <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rank-order">الترتيب</Label>
              <Input id="rank-order" type="number" {...form.register("order")} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="rank-active">مفعّلة</Label>
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
