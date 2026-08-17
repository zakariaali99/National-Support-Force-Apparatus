import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../components/ui/AlertDialog";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Checkbox } from "../../components/ui/Checkbox";
import { DataTable } from "../../components/ui/DataTable";
import { PageHeader } from "../../components/ui/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/Dialog";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Select } from "../../components/ui/Select";
import { showToast } from "../../components/ui/Toast";
import {
  useCreateRole,
  useDeleteRole,
  usePermissionGroups,
  useRoles,
  useUpdateRole,
} from "./api";

const SCOPE_LABELS = {
  all: "الكل — جميع الإدارات",
  own_faction: "إدارته فقط",
  own_records: "السجلات التي أنشأها فقط",
};

function generateRoleCode(text) {
  return (
    "role_" +
    text
      .toLowerCase()
      .replace(/[\s\W]+/g, "_")
      .replace(/^_+|_+$/g, "") || `role_${Date.now()}`
  );
}

export function RolesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: rolesData, isLoading } = useRoles({ page, page_size: pageSize });
  const roles = rolesData?.results ?? (Array.isArray(rolesData) ? rolesData : []);
  const totalCount = rolesData?.count ?? 0;

  const { data: groups = [] } = usePermissionGroups();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [isOpen, setIsOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState("own_faction");
  const [permissions, setPermissions] = useState([]);
  const [validationError, setValidationError] = useState("");
  const [roleToDelete, setRoleToDelete] = useState(null);

  function handleOpenCreate() {
    setEditingRole(null);
    setNameAr("");
    setDescription("");
    setScope("own_faction");
    setPermissions([]);
    setValidationError("");
    setIsOpen(true);
  }

  function handleOpenEdit(role) {
    setEditingRole(role);
    setNameAr(role.name_ar);
    setDescription(role.description || "");
    setScope(role.scope);
    setPermissions(role.permissions || []);
    setValidationError("");
    setIsOpen(true);
  }

  async function handleDelete() {
    if (!roleToDelete) return;
    if (roleToDelete.is_system) {
      setRoleToDelete(null);
      showToast("لا يمكن حذف دور أساسي في النظام.", "error");
      return;
    }
    try {
      await deleteRole.mutateAsync(roleToDelete.id);
      setRoleToDelete(null);
    } catch {
      setRoleToDelete(null);
      showToast("تعذر حذف الدور.", "error");
    }
  }

  function togglePermission(codename, checked) {
    if (checked) {
      setPermissions((prev) => [...prev, codename]);
    } else {
      setPermissions((prev) => prev.filter((p) => p !== codename));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setValidationError("");

    if (!nameAr.trim()) {
      setValidationError("اسم الدور بالعربية مطلوب.");
      return;
    }

    const internalName = editingRole ? editingRole.name : generateRoleCode(nameAr);

    const payload = {
      name: internalName,
      name_ar: nameAr.trim(),
      description: description.trim(),
      scope,
      permissions,
    };

    try {
      if (editingRole) {
        await updateRole.mutateAsync({ id: editingRole.id, ...payload });
      } else {
        await createRole.mutateAsync(payload);
      }
      setIsOpen(false);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        setValidationError(Object.values(data).flat().join(" — "));
      } else {
        setValidationError("تعذر حفظ الدور.");
      }
    }
  }

  const columns = [
    {
      key: "name_ar",
      label: "اسم الدور الوظيفي",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">{row.name_ar}</span>
          {row.is_system && (
            <span className="bg-primary/10 text-primary text-caption font-bold px-2 py-0.5 rounded-full border border-primary/20">
              دور أساسي
            </span>
          )}
        </div>
      ),
    },
    {
      key: "scope",
      label: "نطاق الصلاحيات",
      render: (row) => <span className="text-label font-semibold">{SCOPE_LABELS[row.scope] || row.scope}</span>,
    },
    {
      key: "description",
      label: "الوصف والمسؤوليات",
      render: (row) => <span className="text-label text-muted-foreground">{row.description || "—"}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleOpenEdit(row)}>
            تعديل
          </Button>
          {!row.is_system && (
            <AlertDialog open={roleToDelete?.id === row.id} onOpenChange={(open) => { if (!open) setRoleToDelete(null); }}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setRoleToDelete(row)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>حذف الدور؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف دور «{row.name_ar}» نهائيًا ولا يمكن التراجع عن هذه العملية.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setRoleToDelete(null)}>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="الأدوار والصلاحيات"
        description="إدارة مجموعات الصلاحيات ونطاق الوصول المتاح لأعضاء ومستخدمي النظام."
      >
        <Button onClick={handleOpenCreate} size="sm" className="shadow-xs">
          <Plus className="me-1.5 h-4 w-4" />
          إضافة دور جديد
        </Button>
      </PageHeader>

      <Card className="rounded-2xl border border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-title font-bold">الأدوار المسجلة للنظام</CardTitle>
          <CardDescription className="text-label">الأدوار الوظيفية المحددة ونطاقات الصلاحية الممنوحة</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={roles}
            isLoading={isLoading}
            emptyMessage="لا توجد أدوار مسجلة بعد"
          />
        </CardContent>
      </Card>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038]">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
            <DialogTitle className="text-title font-bold text-slate-900 dark:text-white">
              {editingRole ? `تعديل الدور الوظيفي: ${editingRole.name_ar}` : "إضافة دور وظيفي جديد"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nameAr" className="text-label font-bold text-slate-800 dark:text-slate-200">
                  اسم الدور الوظيفي (بالعربية) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="nameAr"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: مسؤول الفصيل، مدخل بيانات، مشرف العمليات..."
                  required
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="scope" className="text-label font-bold text-slate-800 dark:text-slate-200">
                  نطاق الوصول والبيانات
                </Label>
                <Select
                  value={scope}
                  onValueChange={setScope}
                  options={Object.entries(SCOPE_LABELS).map(([k, v]) => ({
                    value: k,
                    label: v,
                  }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-label font-bold text-slate-800 dark:text-slate-200">
                وصف ومسؤوليات الدور
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر لطبيعة المهام والمسؤوليات المنوطة بحامل هذا الدور..."
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-body font-bold text-slate-900 dark:text-white">
                    جدول الصلاحيات والأذونات التفصيلية
                  </Label>
                  <p className="text-caption text-slate-500 font-medium mt-0.5">
                    حدد الأقسام والوظائف التي يُسمح لحامل هذا الدور باستخدامها:
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-caption font-bold text-[#2B95E8]"
                    onClick={() => {
                      const allCodes = groups.flatMap((g) => Object.keys(g.permissions));
                      setPermissions(allCodes);
                    }}
                  >
                    تحديد الكل
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-caption font-bold text-rose-500"
                    onClick={() => setPermissions([])}
                  >
                    إلغاء التحديد
                  </Button>
                </div>
              </div>

              <div className="space-y-4 max-h-[40vh] overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 bg-slate-50/50 dark:bg-white/5 scrollbar-thin">
                {groups.map((group) => {
                  const groupPermKeys = Object.keys(group.permissions);
                  const isAllGroupSelected = groupPermKeys.every((k) => permissions.includes(k));

                  return (
                    <div key={group.key} className="space-y-2 p-3 bg-white dark:bg-[#1A2038] rounded-xl border border-slate-200/60 dark:border-white/5">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                        <h3 className="font-bold text-label text-[#2B95E8]">
                          {group.label_ar}
                        </h3>
                        <button
                          type="button"
                          className="text-caption font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                          onClick={() => {
                            if (isAllGroupSelected) {
                              setPermissions(permissions.filter((p) => !groupPermKeys.includes(p)));
                            } else {
                              setPermissions(Array.from(new Set([...permissions, ...groupPermKeys])));
                            }
                          }}
                        >
                          {isAllGroupSelected ? "إلغاء قسم" : "تحديد القسم"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-1">
                        {Object.entries(group.permissions).map(([codename, labelAr]) => (
                          <label
                            key={codename}
                            className="flex items-start gap-2.5 text-caption font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 p-2 rounded-xl transition-colors"
                          >
                            <Checkbox
                              checked={permissions.includes(codename)}
                              onCheckedChange={(checked) => togglePermission(codename, Boolean(checked))}
                              className="mt-0.5"
                            />
                            <span className="text-slate-800 dark:text-slate-200">{labelAr}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {validationError && (
              <p className="text-caption text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                {validationError}
              </p>
            )}

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl">
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="rounded-xl font-bold"
                disabled={createRole.isPending || updateRole.isPending}
              >
                {editingRole ? "حفظ التعديلات" : "إنشاء الدور"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RolesPage;
