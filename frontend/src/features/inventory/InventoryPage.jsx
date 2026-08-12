import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, Filter, Search, PackageCheck, AlertTriangle, Layers, UserCheck } from "lucide-react";

import { api } from "../../lib/api";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/Dialog";
import { Label } from "../../components/ui/Label";
import { Textarea } from "../../components/ui/Textarea";
import { showToast } from "../../components/ui/Toast";
import { formatNumber } from "../../lib/format";

export function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [custodyModalOpen, setCustodyModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    serial_number: "",
    caliber: "",
    model_name: "",
    total_quantity: "1",
    status: "good",
    notes: "",
  });

  const [custodyData, setCustodyData] = useState({
    member_id: "",
    notes: "",
  });

  const [categoryFilter, setCategoryFilter] = useState("");

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

  const { data: members = [] } = useQuery({
    queryKey: ["members-lookup"],
    queryFn: async () => (await api.get("members/?page_size=200")).data.results ?? [],
  });

  const createItemMutation = useMutation({
    mutationFn: async (payload) => (await api.post("equipment/items/", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-items"] });
      showToast("تم تسجيل السلاح / العتاد بنجاح", "success");
      setAddModalOpen(false);
      setFormData({
        name: "",
        category: "",
        serial_number: "",
        caliber: "",
        model_name: "",
        total_quantity: "1",
        status: "good",
        notes: "",
      });
    },
    onError: () => showToast("تعذر تسجيل القطعة", "error"),
  });

  const assignCustodyMutation = useMutation({
    mutationFn: async ({ itemId, payload }) =>
      (await api.post(`equipment/items/${itemId}/assign-custody/`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-items"] });
      showToast("تم تسليم العهدة بنجاح", "success");
      setCustodyModalOpen(false);
    },
    onError: () => showToast("تعذر تسليم العهدة", "error"),
  });

  const releaseCustodyMutation = useMutation({
    mutationFn: async (itemId) =>
      (await api.post(`equipment/items/${itemId}/release-custody/`, {})).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-items"] });
      showToast("تم إرجاع العهدة إلى المخزن بنجاح", "success");
    },
    onError: () => showToast("تعذر إرجاع العهدة", "error"),
  });

  const totalCount = items.length;
  const goodCount = items.filter((i) => i.status === "good").length;
  const custodyCount = items.filter((i) => i.assigned_member).length;
  const maintenanceCount = items.filter((i) => i.status === "maintenance" || i.status === "damaged").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="قسم الأسلحة والذخائر بالجرد"
        description="سجل إدارة وحصر قطع السلاح والذخائر والعتاد وتتبع العهد الشخصية والإدارية."
        actions={
          <Button onClick={() => setAddModalOpen(true)} className="font-bold shadow-xs">
            <Plus className="h-4 w-4 me-1.5" />
            إضافة قطعة / عتاد جديد
          </Button>
        }
      />

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-caption font-bold text-muted-foreground">إجمالي قطع العتاد والأسلحة</p>
              <h3 className="text-display font-extrabold text-foreground mt-1">{formatNumber(totalCount)}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-caption font-bold text-muted-foreground">قطع صالحة بالخدمة</p>
              <h3 className="text-display font-extrabold text-success mt-1">{formatNumber(goodCount)}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-success/10 text-success">
              <PackageCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-caption font-bold text-muted-foreground">مسلمة كعهدة شخصية</p>
              <h3 className="text-display font-extrabold text-info mt-1">{formatNumber(custodyCount)}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-info/10 text-info">
              <UserCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-caption font-bold text-muted-foreground">تحت الصيانة / التالفة</p>
              <h3 className="text-display font-extrabold text-danger mt-1">{formatNumber(maintenanceCount)}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-danger/10 text-danger">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Toolbar */}
      <Card className="border border-border/80 shadow-2xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو الرقم التسلسلي..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full sm:w-48">
                <option value="">كافة التصنيفات</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_ar}
                  </option>
                ))}
              </Select>

              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-44">
                <option value="">كافة الحالات</option>
                <option value="good">صالح للاستعمال</option>
                <option value="maintenance">تحت الصيانة</option>
                <option value="damaged">تالف / غير صالح</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/60 flex flex-row items-center justify-between py-3.5">
          <CardTitle className="text-body font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <span>جدول حصر الأسلحة والعتاد</span>
          </CardTitle>
          <Badge variant="secondary" className="font-mono font-bold">
            عدد السجلات: {formatNumber(items.length)}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">جارِ تحميل سجلات الجرد...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Shield className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
              <p className="font-bold text-body text-muted-foreground">لا توجد قطع سلاح أو ذخيرة مسجلة بالجرد حالياً.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 font-bold text-muted-foreground text-caption">
                    <th className="px-4 py-3 text-start w-12">م</th>
                    <th className="px-4 py-3 text-start">الاسم / النوع</th>
                    <th className="px-4 py-3 text-start">الرقم التسلسلي</th>
                    <th className="px-4 py-3 text-start">العيار / الموديل</th>
                    <th className="px-4 py-3 text-start">التصنيف</th>
                    <th className="px-4 py-3 text-start">الحالة التشغيلية</th>
                    <th className="px-4 py-3 text-start">موقعية العهدة</th>
                    <th className="px-4 py-3 text-center w-36">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-extrabold text-foreground">{item.name}</td>
                      <td className="px-4 py-3">
                        {item.serial_number ? (
                          <span className="font-mono font-bold text-xs bg-muted/70 text-foreground px-2 py-1 rounded-md inline-block dir-ltr" dir="ltr">
                            {item.serial_number}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{item.caliber || item.model_name || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-semibold">
                          {item.category_name || "عام"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            item.status === "good"
                              ? "success"
                              : item.status === "maintenance"
                              ? "warning"
                              : "destructive"
                          }
                          className="font-bold"
                        >
                          {item.status === "good" ? "صالح للاستعمال" : item.status === "maintenance" ? "تحت الصيانة" : "تالف / غير صالح"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {item.assigned_member_name ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-foreground">{item.assigned_member_name}</p>
                            <p className="text-caption font-mono text-muted-foreground" dir="ltr">{item.assigned_member_force_number}</p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-caption font-bold">
                            بالمخزن الرئيسي
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.assigned_member ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-danger border-danger/30 hover:bg-danger/10 font-bold"
                            onClick={() => releaseCustodyMutation.mutate(item.id)}
                          >
                            إرجاع للمخزن
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-bold"
                            onClick={() => {
                              setSelectedItem(item);
                              setCustodyModalOpen(true);
                            }}
                          >
                            تسليم عهدة
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Add Item */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تسجيل سلاح / عتاد جديد بالجرد</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createItemMutation.mutate({
                ...formData,
                total_quantity: parseInt(formData.total_quantity, 10) || 1,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label required>اسم السلاح / العتاد</Label>
              <Input
                required
                placeholder="مثال: بندقية كلاشينكوف AK-47"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>التصنيف</Label>
                <Select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">اختر التصنيف</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_ar}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الرقم التسلسلي</Label>
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
                <Label>العيار (Caliber)</Label>
                <Input
                  placeholder="7.62x39 mm"
                  value={formData.caliber}
                  onChange={(e) => setFormData({ ...formData, caliber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>حالة القطعة</Label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="good">صالح للاستعمال</option>
                  <option value="maintenance">تحت الصيانة</option>
                  <option value="damaged">تالف / غير صالح</option>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات الجرد</Label>
              <Textarea
                placeholder="أي ملاحظات فنية حول حالة السلاح أو العتاد..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={createItemMutation.isPending}>
                حفظ وتسجيل بالجرد
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Custody Assign */}
      <Dialog open={custodyModalOpen} onOpenChange={setCustodyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسليم عهدة سلاح لفرد</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedItem) {
                assignCustodyMutation.mutate({
                  itemId: selectedItem.id,
                  payload: custodyData,
                });
              }
            }}
            className="space-y-4"
          >
            <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-1">
              <p className="font-bold text-foreground text-body-sm">{selectedItem?.name}</p>
              {selectedItem?.serial_number && (
                <p className="text-caption font-mono text-muted-foreground" dir="ltr">SN: {selectedItem.serial_number}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label required>اختر الفرد المستلم للعهدة</Label>
              <Select
                required
                value={custodyData.member_id}
                onChange={(e) => setCustodyData({ ...custodyData, member_id: e.target.value })}
              >
                <option value="">اختر الفرد من السجل</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.force_number})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>ملاحظات التسليم</Label>
              <Textarea
                placeholder="تاريخ أو شروط التسليم..."
                value={custodyData.notes}
                onChange={(e) => setCustodyData({ ...custodyData, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCustodyModalOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={assignCustodyMutation.isPending}>
                تأكيد وتسليم العهدة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
