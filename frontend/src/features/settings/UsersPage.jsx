import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

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
import { Switch } from "../../components/ui/Switch";
import { factionsApi } from "../organization/api";
import {
  useCreateUser,
  useDeleteUser,
  useRoles,
  useUpdateUser,
  useUsers,
} from "./api";

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: usersData, isLoading: isUsersLoading } = useUsers({ page, page_size: pageSize });
  const users = usersData?.results || [];
  const totalCount = usersData?.count || 0;

  const { data: rolesData } = useRoles({ page_size: 100 });
  const roles = rolesData?.results || [];

  const { data: factions = [] } = factionsApi.useList({ ordering: "name_ar" });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedFactions, setSelectedFactions] = useState([]);
  const [validationError, setValidationError] = useState("");

  function handleOpenCreate() {
    setEditingUser(null);
    setUsername("");
    setPassword("");
    setEmail("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setIsActive(true);
    setIsVerified(true);
    setIsStaff(false);
    setSelectedRoles([]);
    setSelectedFactions([]);
    setValidationError("");
    setIsOpen(true);
  }

  function handleOpenEdit(user) {
    setEditingUser(user);
    setUsername(user.username);
    setPassword("");
    setEmail(user.email || "");
    setFirstName(user.first_name || "");
    setLastName(user.last_name || "");
    setPhone(user.phone || "");
    setIsActive(user.is_active);
    setIsVerified(user.is_verified);
    setIsStaff(user.is_staff);
    setSelectedRoles(user.roles || []);
    setSelectedFactions(user.factions || []);
    setValidationError("");
    setIsOpen(true);
  }

  async function handleDelete(user) {
    if (window.confirm(`هل تريد إيقاف تفعيل حساب المستخدم "${user.username}"؟`)) {
      try {
        await deleteUser.mutateAsync(user.id);
      } catch {
        alert("تعذر إيقاف تفعيل المستخدم.");
      }
    }
  }

  function toggleRoleSelection(roleId) {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  }

  function toggleFactionSelection(factionId) {
    setSelectedFactions((prev) =>
      prev.includes(factionId)
        ? prev.filter((id) => id !== factionId)
        : [...prev, factionId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setValidationError("");

    if (!username.trim()) {
      setValidationError("اسم المستخدم مطلوب.");
      return;
    }
    if (!editingUser && !password) {
      setValidationError("كلمة المرور مطلوبة للمستخدم الجديد.");
      return;
    }

    const payload = {
      username: username.trim(),
      email: email.trim() || undefined,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() || null,
      is_active: isActive,
      is_verified: isVerified,
      is_staff: isStaff,
      roles: selectedRoles,
      factions: selectedFactions,
    };

    if (password) {
      payload.password = password;
    }

    try {
      if (editingUser) {
        await updateUser.mutateAsync({ id: editingUser.id, ...payload });
      } else {
        await createUser.mutateAsync(payload);
      }
      setIsOpen(false);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        setValidationError(Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" — "));
      } else {
        setValidationError("تعذر حفظ بيانات المستخدم.");
      }
    }
  }

  // Find user's roles' scope to conditionally display factions selection
  const showFactionSelector = selectedRoles.some((roleId) => {
    const roleObj = roles.find((r) => r.id === roleId);
    return roleObj?.scope === "own_faction";
  });

  const columns = [
    {
      key: "username",
      label: "اسم المستخدم / الحساب",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold">{row.username}</span>
          <span className="text-caption text-muted-foreground">{row.email || "لا يوجد بريد إلكتروني"}</span>
        </div>
      ),
    },
    {
      key: "fullName",
      label: "الاسم الكامل",
      render: (row) => (
        <span>
          {row.first_name} {row.last_name}
        </span>
      ),
    },
    {
      key: "roles",
      label: "الأدوار",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles?.map((roleId) => {
            const roleObj = roles.find((r) => r.id === roleId);
            return (
              <span
                key={roleId}
                className="bg-primary/10 text-primary text-caption font-semibold px-2 py-0.5 rounded-full"
              >
                {roleObj?.name_ar || `دور #${roleId}`}
              </span>
            );
          }) || <span className="text-muted-foreground text-caption">—</span>}
        </div>
      ),
    },
    {
      key: "status",
      label: "الحالة",
      render: (row) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-label font-semibold ${
            row.is_active
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {row.is_active ? "نشط" : "معطل"}
        </span>
      ),
    },
    {
      key: "phone",
      label: "رقم الهاتف",
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleOpenEdit(row)}>
            تعديل
          </Button>
          {row.is_active && (
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
      <PageHeader
        title="مستخدمو النظام"
        description="إدارة الحسابات المسؤولة عن تشغيل وإدخال البيانات على النظام."
      >
        <Button onClick={handleOpenCreate}>
          <Plus className="me-2 h-4 w-4" />
          إضافة مستخدم جديد
        </Button>
      </PageHeader>

      <Card className="rounded-2xl border border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-title font-bold">حسابات مستخدمي النظام</CardTitle>
          <CardDescription className="text-label">قائمة الحسابات المخولة للدخول وإدارة بيانات الجهاز</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={users}
            isLoading={isUsersLoading}
            emptyMessage="لا يوجد مستخدمون مسجلون بعد"
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
              {editingUser ? `تعديل بيانات المستخدم: ${editingUser.username}` : "إضافة مستخدم جديد"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="username">اسم المستخدم (للدخول)</Label>
                <Input
                  id="username"
                  value={username}
                  disabled={Boolean(editingUser)}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ahmed_99"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">
                  كلمة المرور {editingUser && "(اتركه فارغاً لعدم التغيير)"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">الاسم الأول</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="الاسم الأول"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">اللقب / الكنية</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="اللقب"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mail@example.com"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09XXXXXXXX"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="isActive">الحساب نشط</Label>
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="isVerified">حساب مؤكد</Label>
                <Switch id="isVerified" checked={isVerified} onCheckedChange={setIsVerified} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="isStaff">حق دخول الإدارة</Label>
                <Switch id="isStaff" checked={isStaff} onCheckedChange={setIsStaff} />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <Label className="text-body font-bold">تعيين الأدوار</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-[15vh] overflow-y-auto border border-border rounded-lg p-2.5 bg-secondary/15">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 text-label cursor-pointer hover:bg-secondary/40 p-1 rounded"
                  >
                    <Checkbox
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={(checked) => toggleRoleSelection(role.id)}
                      className="h-4 w-4"
                    />
                    <span>{role.name_ar}</span>
                  </label>
                ))}
              </div>
            </div>

            {showFactionSelector && (
              <div className="border-t border-border pt-4">
                <Label className="text-body font-bold">تعيين الإدارات المصرح بها</Label>
                <p className="text-label text-muted-foreground mb-1.5">
                  هذا المستخدم لديه أدوار محدودة بإدارته. حدد الإدارات التي يسمح له بالوصول إليها.
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-[15vh] overflow-y-auto border border-border rounded-lg p-2.5 bg-secondary/15">
                  {factions.map((f) => (
                    <label
                      key={f.id}
                      className="flex items-center gap-2 text-label cursor-pointer hover:bg-secondary/40 p-1 rounded"
                    >
                      <Checkbox
                        checked={selectedFactions.includes(f.id)}
                        onCheckedChange={(checked) => toggleFactionSelection(f.id)}
                        className="h-4 w-4"
                      />
                      <span>{f.name_ar}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {validationError && (
              <p className="text-body text-destructive font-semibold">{validationError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={
                  createUser.isPending || updateUser.isPending
                }
              >
                {editingUser ? "تعديل البيانات" : "إنشاء الحساب"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
