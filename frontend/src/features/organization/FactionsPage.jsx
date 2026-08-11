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
import { Textarea } from "../../components/ui/Textarea";
import { useAuth } from "../auth/AuthContext";
import { factionsApi } from "./api";

const schema = z.object({
  name_ar: z.string().min(1, "الاسم مطلوب"),
  description: z.string().optional(),
  is_active: z.boolean(),
});

function generateSlug(text) {
  return (
    text
      .toLowerCase()
      .replace(/[\s\W]+/g, "-")
      .replace(/^-+|-+$/g, "") || `faction-${Date.now()}`
  );
}

export function FactionsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("organization.manage");

  const { data: factions = [], isLoading } = factionsApi.useList({ ordering: "name_ar" });
  const createFaction = factionsApi.useCreate();
  const updateFaction = factionsApi.useUpdate();
  const removeFaction = factionsApi.useRemove();

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
      description: faction.description ?? "",
      is_active: faction.is_active,
    });
    setDialogState(faction);
  }

  async function onSubmit(values) {
    if (dialogState === "create") {
      const code = generateSlug(values.name_ar);
      await createFaction.mutateAsync({ ...values, code });
    } else {
      const code = dialogState.code || generateSlug(values.name_ar);
      await updateFaction.mutateAsync({ id: dialogState.id, ...values, code });
    }
    setDialogState(null);
  }

  async function onDelete(faction) {
    if (window.confirm(`هل تريد حذف الفصيل "${faction.name_ar}"؟`)) {
      await removeFaction.mutateAsync(faction.id);
    }
  }

  const columns = [
    { key: "name_ar", label: "اسم الفصيل / الإدارة" },
    { key: "description", label: "الوصف والمهام" },
    {
      key: "is_active",
      label: "الحالة",
      render: (row) => (
        <span className={row.is_active ? "text-success font-bold" : "text-muted-foreground"}>
          {row.is_active ? "مفعّل" : "معطّل"}
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
      <Card className="rounded-2xl border border-border/80 shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl font-bold">فصائل وإدارات الجهاز</CardTitle>
            <CardDescription className="text-xs">الأقسام والوحدات التنفيذية التي ينتمي إليها أعضاء القوة المساندة</CardDescription>
          </div>
          {canManage && (
            <Button onClick={openCreate} size="sm" className="shadow-xs">
              <Plus className="h-4 w-4 me-1.5" />
              إضافة فصيل جديد
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} rows={factions} isLoading={isLoading} emptyMessage="لا توجد فصائل مسجلة بعد" />
        </CardContent>
      </Card>

      <Dialog open={Boolean(dialogState)} onOpenChange={(open) => !open && setDialogState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState === "create" ? "إضافة فصيل جديد" : "تعديل بيانات الفصيل"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="faction-name">اسم الفصيل / الإدارة</Label>
              <Input id="faction-name" placeholder="اسم الفصيل بالعربية..." {...form.register("name_ar")} />
              {form.formState.errors.name_ar && (
                <p className="text-xs text-destructive">{form.formState.errors.name_ar.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="faction-description">الوصف والمهام الفرعية</Label>
              <Textarea id="faction-description" placeholder="اختياري..." {...form.register("description")} />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="faction-active">تفعيل الفصيل في النظام</Label>
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
