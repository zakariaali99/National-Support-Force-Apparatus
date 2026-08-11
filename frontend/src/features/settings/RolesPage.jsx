import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
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
import {
  useCreateRole,
  useDeleteRole,
  usePermissionGroups,
  useRoles,
  useUpdateRole,
} from "./api";

const SCOPE_LABELS = {
  all: "الكل — جميع الفصائل",
  own_faction: "فصيله فقط",
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

  async function handleDelete(role) {
    if (role.is_system) {
      alert("لا يمكن حذف دور أساسي في النظام.");
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف الدور "${role.name_ar}"؟`)) {
      try {
        await deleteRole.mutateAsync(role.id);
      } catch {
        alert("تعذر حذف الدور.");
      }
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
            <span className="bg-primary/10 text-primary text-micro font-bold px-2 py-0.5 rounded-full border border-primary/20">
              دور أساسي
            </span>
          )}
        </div>
      ),
    },
    {
      key: "scope",
      label: "نطاق الصلاحيات",
      render: (row) => <span className="text-xs font-semibold">{SCOPE_LABELS[row.scope] || row.scope}</span>,
    },
    {
      key: "description",
      label: "الوصف والمسؤوليات",
      render: (row) => <span className="text-xs text-muted-foreground">{row.description || "—"}</span>,
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
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(row)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">الأدوار والصلاحيات</h1>
          <p className="text-xs text-muted-foreground font-medium mt-1">
            إدارة مجموعات الصلاحيات ونطاق الوصول المتاح لأعضاء ومستخدمي النظام.
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="shadow-xs">
          <Plus className="me-1.5 h-4 w-4" />
          إضافة دور جديد
        </Button>
      </div>

      <Card className="rounded-2xl border border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold">الأدوار المسجلة للنظام</CardTitle>
          <CardDescription className="text-xs">الأدوار الوظيفية المحددة ونطاقات الصلاحية الممنوحة</CardDescription>
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
        <DialogContent className="w-[min(92vw,36rem)] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? `تعديل دور: ${editingRole.name_ar}` : "إضافة دور جديد"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nameAr">اسم الدور الوظيفي (بالعربية)</Label>
              <Input
                id="nameAr"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: مسؤول فصيل، مدخل بيانات، مشرف عام..."
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="scope">نطاق الوصول الافتراضي</Label>
                <Select id="scope" value={scope} onChange={(e) => setScope(e.target.value)}>
                  {Object.entries(SCOPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">وصف وتفاصيل الدور</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر للمسؤوليات..."
                />
              </div>
            </div>

            <div className="border-t border-border/80 pt-4">
              <Label className="text-sm font-extrabold text-foreground">جدول الصلاحيات التفصيلية</Label>
              <p className="text-xs text-muted-foreground mb-3 font-medium">
                حدد الصلاحيات الممنوحة لحامل هذا الدور في مختلف قطاعات النظام:
              </p>

              <div className="space-y-4 max-h-[35vh] overflow-y-auto border border-border/80 rounded-xl p-3 bg-secondary/20 scrollbar-thin">
                {groups.map((group) => (
                  <div key={group.key} className="space-y-1.5">
                    <h3 className="font-bold text-xs border-b border-border/60 pb-1 text-primary">
                      {group.label_ar}
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {Object.entries(group.permissions).map(([codename, labelAr]) => (
                        <label
                          key={codename}
                          className="flex items-start gap-2 text-xs font-medium cursor-pointer hover:bg-secondary/40 p-1.5 rounded-lg transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={permissions.includes(codename)}
                            onChange={(e) => togglePermission(codename, e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span>{labelAr}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {validationError && (
              <p className="text-xs text-destructive font-bold bg-destructive/10 p-2.5 rounded-lg">{validationError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={
                  createRole.isPending || updateRole.isPending
                }
              >
                {editingRole ? "تعديل الدور" : "حفظ الدور"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
