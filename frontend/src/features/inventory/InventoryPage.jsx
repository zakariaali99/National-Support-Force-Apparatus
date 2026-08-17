import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Plus,
  Filter,
  Search,
  PackageCheck,
  AlertTriangle,
  Layers,
  UserCheck,
  Package,
  Wrench,
  Boxes,
  RotateCcw,
  CheckCircle,
} from "lucide-react";

import { api } from "../../lib/api";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/Dialog";
import { Label } from "../../components/ui/Label";
import { Textarea } from "../../components/ui/Textarea";
import { showToast } from "../../components/ui/Toast";
import { StatCard } from "../../components/ui/StatCard";

export function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeTab, setTypeTab] = useState("all");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [custodyModalOpen, setCustodyModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    item_code: "",
    size_spec: "",
    serial_number: "",
    caliber: "",
    model_name: "",
    total_quantity: "1",
    available_quantity: "1",
    status: "good",
    notes: "",
  });

  const [custodyData, setCustodyData] = useState({
    member_id: "",
    quantity: "1",
    notes: "",
  });

  const [returnData, setReturnData] = useState({
    quantity: "1",
    notes: "",
  });

  const [damageData, setDamageData] = useState({
    quantity: "1",
    source: "custody",
    notes: "",
  });

  const { data: rawCategories = [] } = useQuery({
    queryKey: ["equipment-categories"],
    queryFn: async () => (await api.get("equipment/categories/")).data,
  });
  const categories = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.results ?? []);

  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ["equipment-items", search, statusFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      return (await api.get(`equipment/items/?${params.toString()}`)).data;
    },
  });
  const items = Array.isArray(rawItems) ? rawItems : (rawItems?.results ?? []);

  const filteredItems = useMemo(() => {
    if (typeTab === "weapons") {
      return items.filter((i) => ["rifle", "pistol", "machine_gun", "ammo"].includes(i.category_type));
    }
    if (typeTab === "warehouse") {
      return items.filter((i) => !["rifle", "pistol", "machine_gun", "ammo"].includes(i.category_type));
    }
    return items;
  }, [items, typeTab]);

  const { data: members = [] } = useQuery({
    queryKey: ["members-lookup"],
    queryFn: async () => (await api.get("members/?page_size=200")).data.results ?? [],
  });

  // Calculate high-level stock statistics
  const stats = useMemo(() => {
    let totalItems = 0;
    let totalQty = 0;
    let availableQty = 0;
    let assignedQty = 0;
    let damagedQty = 0;

    items.forEach((item) => {
      totalItems += 1;
      totalQty += item.total_quantity || 1;
      availableQty += item.available_quantity || 0;
      assignedQty += item.assigned_quantity || 0;
      damagedQty += item.damaged_quantity || 0;
    });

    return { totalItems, totalQty, availableQty, assignedQty, damagedQty };
  }, [items]);

  const createItemMutation = useMutation({
    mutationFn: async (payload) => (await api.post("equipment/items/", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-items"] });
      showToast("تم تسجيل الصنف / السلاح بنجاح", "success");
      setAddModalOpen(false);
      setFormData({
        name: "",
        category: "",
        item_code: "",
        size_spec: "",
        serial_number: "",
        caliber: "",
        model_name: "",
        total_quantity: "1",
        available_quantity: "1",
        status: "good",
        notes: "",
      });
    },
    onError: () => showToast("تعذر تسجيل الصنف", "error"),
  });

  const assignCustodyMutation = useMutation({
    mutationFn: async ({ itemId, payload }) =>
      (await api.post(`equipment/items/${itemId}/assign-custody/`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-items"] });
      showToast("تم تسليم العهدة وخصمها من رصيد المخزن المتاح بنجاح", "success");
      setCustodyModalOpen(false);
    },
    onError: (err) => showToast(err?.response?.data?.detail || "تعذر تسليم العهدة", "error"),
  });

  const releaseCustodyMutation = useMutation({
    mutationFn: async ({ itemId, payload }) =>
      (await api.post(`equipment/items/${itemId}/release-custody/`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-items"] });
      showToast("تم إرجاع العهدة وإضافتها لرصيد المخزن المتاح", "success");
      setReturnModalOpen(false);
    },
    onError: () => showToast("تعذر إرجاع العهدة", "error"),
  });

  const markDamagedMutation = useMutation({
    mutationFn: async ({ itemId, payload }) =>
      (await api.post(`equipment/items/${itemId}/mark-damaged/`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-items"] });
      showToast("تم تسجيل التالف في سجل التوالف بنجاح", "success");
      setDamageModalOpen(false);
    },
    onError: () => showToast("تعذر تسجيل التالف", "error"),
  });

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="المستودع وإدارة المخازن والعهدة"
        description="جرد الأسلحة، العتاد، والمهمات وتتبع حركة تسليم وارتداد وتلف العهدة بشكل فوري."
      >
        <Button variant="primary" onClick={() => setAddModalOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          <span>تسجيل صنف / عتاد جديد</span>
        </Button>
      </PageHeader>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="إجمالي المخزون المملوك" value={stats.totalQty} icon={Boxes} variant="default" />
        <StatCard title="المتاح في المستودع" value={stats.availableQty} icon={PackageCheck} variant="success" />
        <StatCard title="المسلّم كعهدة للأفراد" value={stats.assignedQty} icon={UserCheck} variant="gold" />
        <StatCard title="التالف والمكهن" value={stats.damagedQty} icon={AlertTriangle} variant="danger" />
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => setTypeTab("all")}
            className={`px-3.5 py-1.5 rounded-lg text-body-sm font-semibold transition-all ${
              typeTab === "all"
                ? "bg-surface text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            كافة الأصناف ({items.length})
          </button>
          <button
            onClick={() => setTypeTab("weapons")}
            className={`px-3.5 py-1.5 rounded-lg text-body-sm font-semibold transition-all ${
              typeTab === "weapons"
                ? "bg-surface text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            قسم التسليح والذخائر
          </button>
          <button
            onClick={() => setTypeTab("warehouse")}
            className={`px-3.5 py-1.5 rounded-lg text-body-sm font-semibold transition-all ${
              typeTab === "warehouse"
                ? "bg-surface text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            قسم المخزن والمهمات
          </button>
        </div>

        {/* Filter Inputs */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم، الكود، أو السيريال..."
              className="pr-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { value: "", label: "كافة الحالات" },
              { value: "good", label: "صالح للاستعمال" },
              { value: "maintenance", label: "تحت الصيانة" },
              { value: "damaged", label: "تالف / مكهن" },
            ]}
          />
        </div>
      </div>

      {/* Inventory Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">جاري تحميل سجلات المخزن...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500">لا توجد أصناف تطابق شروط البحث الحالية.</div>
          ) : (
            <table className="w-full text-right text-body-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3.5">اسم الصنف / السلاح</th>
                  <th className="p-3.5">الكود / الرقم التسلسلي</th>
                  <th className="p-3.5">المقاس / المواصفة</th>
                  <th className="p-3.5">التصنيف</th>
                  <th className="p-3.5 text-center">المتاح / الإجمالي</th>
                  <th className="p-3.5">حالة الصنف</th>
                  <th className="p-3.5">موقع العهدة الحالية</th>
                  <th className="p-3.5 text-center min-w-[190px]">حركات العهدة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Item Name */}
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</div>
                      {item.caliber && <div className="text-caption text-amber-700 dark:text-amber-300 font-mono font-medium">{item.caliber}</div>}
                    </td>

                    {/* Code & Serial */}
                    <td className="p-3.5 font-mono text-caption">
                      {item.item_code && (
                        <span className="block font-semibold text-slate-800 dark:text-slate-200">{item.item_code}</span>
                      )}
                      {item.serial_number ? (
                        <span className="text-slate-500 dir-ltr inline-block">
                          {item.serial_number}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Size / Spec */}
                    <td className="p-3.5 text-body-sm text-slate-700 dark:text-slate-300 font-medium">
                      {item.size_spec || "—"}
                    </td>

                    {/* Category */}
                    <td className="p-3.5">
                      <Badge variant="secondary">{item.category_name || "عام"}</Badge>
                    </td>

                    {/* Stock Counters */}
                    <td className="p-3.5 text-center font-mono">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 text-body">{item.available_quantity ?? item.total_quantity}</span>
                        <span className="text-slate-400">/</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.total_quantity}</span>
                      </div>
                      {item.assigned_quantity > 0 && (
                        <div className="text-caption text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                          ({item.assigned_quantity} مسلّمة)
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <Badge
                        variant={
                          item.status === "good"
                            ? "success"
                            : item.status === "maintenance"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {item.status === "good"
                          ? "صالح للاستعمال"
                          : item.status === "maintenance"
                          ? "تحت الصيانة"
                          : "تالف / مكهن"}
                      </Badge>
                    </td>

                    {/* Current Custody Location */}
                    <td className="p-3.5">
                      {item.assigned_member_name ? (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-body-sm">{item.assigned_member_name}</div>
                          <div className="text-caption text-slate-500 font-mono">{item.assigned_member_force_number}</div>
                        </div>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-caption font-semibold text-slate-600 dark:text-slate-300">
                          بالمخزن الرئيسي
                        </span>
                      )}
                    </td>

                    {/* Custody Actions */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Issue Custody */}
                        <Button
                          size="sm"
                          variant="soft-blue"
                          onClick={() => {
                            setSelectedItem(item);
                            setCustodyData({ member_id: "", quantity: "1", notes: "" });
                            setCustodyModalOpen(true);
                          }}
                          disabled={(item.available_quantity ?? item.total_quantity) <= 0}
                          title="تسليم عهدة"
                        >
                          تسليم
                        </Button>

                        {/* Return Custody */}
                        {item.assigned_quantity > 0 && (
                          <Button
                            size="sm"
                            variant="soft-emerald"
                            onClick={() => {
                              setSelectedItem(item);
                              setReturnData({ quantity: String(item.assigned_quantity), notes: "" });
                              setReturnModalOpen(true);
                            }}
                            title="إرجاع للمخزن"
                          >
                            إرجاع
                          </Button>
                        )}

                        {/* Mark Damaged */}
                        <Button
                          size="icon-sm"
                          variant="soft-rose"
                          onClick={() => {
                            setSelectedItem(item);
                            setDamageData({
                              quantity: "1",
                              source: item.assigned_quantity > 0 ? "custody" : "warehouse",
                              notes: "",
                            });
                            setDamageModalOpen(true);
                          }}
                          title="تسجيل تالف / مكهن"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Modal 1: Add New Item */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>تسجيل صنف / عتاد جديد بالمخزن</DialogTitle>
                <DialogDescription>أدخل بيانات الصنف والكميات لحفظه في سجلات المخزن والمستودع.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createItemMutation.mutate({
                ...formData,
                total_quantity: parseInt(formData.total_quantity, 10) || 1,
                available_quantity: parseInt(formData.total_quantity, 10) || 1,
              });
            }}
            className="space-y-4 pt-1"
          >
            <div className="space-y-1.5">
              <Label className="text-label text-slate-800 dark:text-slate-200">اسم الصنف أو السلاح *</Label>
              <Input
                required
                placeholder="مثال: بندقية كلاشينكوف / بدلة عسكرية صحراوي"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-label text-slate-800 dark:text-slate-200">التصنيف المخزني *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                  options={categories.map((c) => ({ value: String(c.id), label: c.name_ar }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-label text-slate-800 dark:text-slate-200">رقم / كود الصنف</Label>
                <Input
                  placeholder="مثال: WPN-001 / UNIF-XL"
                  value={formData.item_code}
                  onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-label text-slate-800 dark:text-slate-200">المقاس أو المواصفة</Label>
                <Input
                  placeholder="مثال: مقاس XL / 42 / 7.62 مم"
                  value={formData.size_spec}
                  onChange={(e) => setFormData({ ...formData, size_spec: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-label text-slate-800 dark:text-slate-200">الرقم التسلسلي (إن وجد)</Label>
                <Input
                  dir="ltr"
                  placeholder="SN-998822"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-label text-slate-800 dark:text-slate-200">الكمية الإجمالية *</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={formData.total_quantity}
                  onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-label text-slate-800 dark:text-slate-200">الحالة الفنية</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                  options={[
                    { value: "good", label: "صالح للاستعمال" },
                    { value: "maintenance", label: "تحت الصيانة" },
                    { value: "damaged", label: "تالف / مكهن" },
                  ]}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-label text-slate-800 dark:text-slate-200">ملاحظات الصنف</Label>
              <Textarea
                placeholder="أي تفاصيل فنية أو موقع التخزين في المستودع..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" variant="primary" disabled={createItemMutation.isPending}>
                حفظ وإضافة للمخزن
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Issue Custody */}
      <Dialog open={custodyModalOpen} onOpenChange={setCustodyModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>تسليم عهدة لفرد من المخزن</DialogTitle>
                <DialogDescription>سيتم خصم الكمية المسلمة فوراً من الرصيد المتاح بالمستودع.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedItem) {
                assignCustodyMutation.mutate({
                  itemId: selectedItem.id,
                  payload: {
                    member_id: parseInt(custodyData.member_id, 10),
                    quantity: parseInt(custodyData.quantity, 10) || 1,
                    notes: custodyData.notes,
                  },
                });
              }
            }}
            className="space-y-4 pt-1"
          >
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
              <p className="font-bold text-slate-900 dark:text-slate-100 text-body-sm">{selectedItem?.name}</p>
              <div className="text-caption text-slate-500 flex items-center justify-between">
                <span>المقاس: {selectedItem?.size_spec || "—"}</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  الرصيد المتاح: {selectedItem?.available_quantity} قطعة
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-label text-slate-800 dark:text-slate-200">اختر الفرد المستلم للعهدة *</Label>
              <Select
                value={custodyData.member_id}
                onValueChange={(val) => setCustodyData({ ...custodyData, member_id: val })}
                options={members.map((m) => ({
                  value: String(m.id),
                  label: `${m.full_name} (${m.force_number || "بدون رقم"})`,
                }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-label text-slate-800 dark:text-slate-200">الكمية المسلمة *</Label>
              <Input
                type="number"
                min="1"
                max={selectedItem?.available_quantity || 1}
                value={custodyData.quantity}
                onChange={(e) => setCustodyData({ ...custodyData, quantity: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-label text-slate-800 dark:text-slate-200">ملاحظات التسليم</Label>
              <Textarea
                placeholder="أمر الصرف أو سبب تسليم العهدة..."
                value={custodyData.notes}
                onChange={(e) => setCustodyData({ ...custodyData, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCustodyModalOpen(false)}>
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={assignCustodyMutation.isPending || !custodyData.member_id}
              >
                تأكيد وتسليم العهدة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Return Custody */}
      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>إرجاع عهدة للمستودع</DialogTitle>
                <DialogDescription>سترتد الكمية المرجعة مباشرة إلى الرصيد المتاح بالمخزن.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedItem) {
                releaseCustodyMutation.mutate({
                  itemId: selectedItem.id,
                  payload: {
                    quantity: parseInt(returnData.quantity, 10) || 1,
                    notes: returnData.notes,
                  },
                });
              }
            }}
            className="space-y-4 pt-1"
          >
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
              <p className="font-bold text-slate-900 dark:text-slate-100 text-body-sm">{selectedItem?.name}</p>
              <div className="text-caption text-slate-500 flex items-center justify-between">
                <span>المسلّم حالياً: {selectedItem?.assigned_quantity} قطعة</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  سيصبح المتاح: {(selectedItem?.available_quantity || 0) + (parseInt(returnData.quantity, 10) || 0)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-label text-slate-800 dark:text-slate-200">الكمية المرجعة للمخزن *</Label>
              <Input
                type="number"
                min="1"
                max={selectedItem?.assigned_quantity || 1}
                value={returnData.quantity}
                onChange={(e) => setReturnData({ ...returnData, quantity: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-label text-slate-800 dark:text-slate-200">ملاحظات الاسترجاع والفحص</Label>
              <Textarea
                placeholder="حالة الصنف عند الاستلام وملاحظات الفحص الفني..."
                value={returnData.notes}
                onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReturnModalOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" variant="primary" disabled={releaseCustodyMutation.isPending}>
                تأكيد إرجاع العهدة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Mark Damaged */}
      <Dialog open={damageModalOpen} onOpenChange={setDamageModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>تسجيل صنف تالف / مكهن</DialogTitle>
                <DialogDescription>سيتم قيد الصنف في سجل التوالف والمستهلكات ولن يعاد للرصيد المتاح.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedItem) {
                markDamagedMutation.mutate({
                  itemId: selectedItem.id,
                  payload: {
                    quantity: parseInt(damageData.quantity, 10) || 1,
                    source: damageData.source,
                    notes: damageData.notes,
                  },
                });
              }
            }}
            className="space-y-4 pt-1"
          >
            <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 space-y-1">
              <p className="font-bold text-rose-900 dark:text-rose-200 text-body-sm">{selectedItem?.name}</p>
              <p className="text-caption text-rose-700 dark:text-rose-300">
                تسجيل الصنف كتالف يُسقطه من العهدة أو المخزون النشط ويُقيده في سجل التوالف.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-label text-slate-800 dark:text-slate-200">الكمية التالفة *</Label>
                <Input
                  type="number"
                  min="1"
                  value={damageData.quantity}
                  onChange={(e) => setDamageData({ ...damageData, quantity: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-label text-slate-800 dark:text-slate-200">سبب التلف ومحضر الإثبات *</Label>
              <Textarea
                required
                placeholder="شرح أسباب التلف أو الكسر أو الفقدان..."
                value={damageData.notes}
                onChange={(e) => setDamageData({ ...damageData, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDamageModalOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" variant="destructive" disabled={markDamagedMutation.isPending}>
                تسجيل التالف
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
