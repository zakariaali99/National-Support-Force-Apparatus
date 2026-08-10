import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
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

export function RolesPage() {
  const { data: roles = [], isLoading } = useRoles();
  const { data: groups = [] } = usePermissionGroups();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [isOpen, setIsOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState("own_faction");
  const [permissions, setPermissions] = useState([]);
  const [validationError, setValidationError] = useState("");

  function handleOpenCreate() {
    setEditingRole(null);
    setName("");
    setNameAr("");
    setDescription("");
    setScope("own_faction");
    setPermissions([]);
    setValidationError("");
    setIsOpen(true);
  }

  function handleOpenEdit(role) {
    setEditingRole(role);
    setName(role.name);
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

    if (!name.trim()) {
      setValidationError("رمز المعرف مطلوب باللغة الإنجليزية.");
      return;
    }
    if (!nameAr.trim()) {
      setValidationError("الاسم العربي مطلوب.");
      return;
    }

    const payload = {
      name: name.trim().toLowerCase(),
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
      label: "اسم الدور",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{row.name_ar}</span>
          {row.is_system && (
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded">
              نظام أساسي
            </span>
          )}
        </div>
      ),
    },
    {
      key: "name",
      label: "رمز المعرف",
      render: (row) => <code className="text-xs text-muted-foreground">{row.name}</code>,
    },
    {
      key: "scope",
      label: "نطاق الصلاحيات",
      render: (row) => <span>{SCOPE_LABELS[row.scope] || row.scope}</span>,
    },
    {
      key: "description",
      label: "الوصف",
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
          <h1 className="text-2xl font-bold tracking-tight">الأدوار والصلاحيات</h1>
          <p className="text-sm text-muted-foreground">
            إدارة مجموعات الصلاحيات ونطاق الوصول للأعضاء ومستخدمي النظام.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="me-2 h-4 w-4" />
          إضافة دور جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الأدوار المسجلة</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={roles}
            isLoading={isLoading}
            emptyMessage="لا توجد أدوار مضافة"
          />
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[min(92vw,36rem)] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? `تعديل دور: ${editingRole.name_ar}` : "إضافة دور جديد"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">رمز المعرف (بالإنجليزي)</Label>
                <Input
                  id="name"
                  value={name}
                  disabled={Boolean(editingRole)}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. general_clerk"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nameAr">الاسم العربي للدور</Label>
                <Input
                  id="nameAr"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: مدخل بيانات الفصيل"
                />
              </div>
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
                <Label htmlFor="description">وصف الدور</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر لمسؤوليات هذا الدور"
                />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <Label className="text-base font-bold">صلاحيات الدور</Label>
              <p className="text-xs text-muted-foreground mb-3">
                حدد الصلاحيات والامتيازات التي تمنحها لحامل هذا الدور.
              </p>

              <div className="space-y-4 max-h-[35vh] overflow-y-auto border border-border rounded-lg p-3 bg-secondary/20">
                {groups.map((group) => (
                  <div key={group.key} className="space-y-1.5">
                    <h3 className="font-bold text-sm border-b border-border pb-1 text-primary">
                      {group.label_ar}
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {Object.entries(group.permissions).map(([codename, labelAr]) => (
                        <label
                          key={codename}
                          className="flex items-start gap-2 text-sm cursor-pointer hover:bg-secondary/40 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={permissions.includes(codename)}
                            onChange={(e) => togglePermission(codename, e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
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
              <p className="text-sm text-destructive font-medium">{validationError}</p>
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
                {editingRole ? "تعديل الدور" : "إضافة الدور"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
