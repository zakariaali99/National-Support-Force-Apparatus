import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Crosshair,
  Plus,
  Search,
  Filter,
  PackageCheck,
  RotateCcw,
  AlertTriangle,
  FileCheck2,
  QrCode,
  Printer,
  Shield,
  Zap,
  Boxes,
  UserCheck,
  CheckCircle,
  Pencil,
  Trash2,
} from "lucide-react";

import { api } from "../../lib/api";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/Dialog";
import { Label } from "../../components/ui/Label";
import { Textarea } from "../../components/ui/Textarea";
import { showToast } from "../../components/ui/Toast";
import { StatCard } from "../../components/ui/StatCard";
import { CustodyHandoverVoucherDialog } from "../inventory/CustodyHandoverVoucherDialog";
import { AssetQRCode } from "../../components/qr/AssetQRCode";
import { openAuthedPdf, downloadAuthedFile } from "../reports/api";

const STATUS_MAP = {
  good: { label: "صالح للخدمة", variant: "success" },
  maintenance: { label: "تحت الصيانة", variant: "warning" },
  damaged: { label: "تالف / معطل", variant: "danger" },
  retired: { label: "مستبعد / مكهن", variant: "secondary" },
};

export function ArmoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeTab, setTypeTab] = useState("all");
  const [isPrintingSummary, setIsPrintingSummary] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [custodyModalOpen, setCustodyModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
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

  // Query Armory Categories
  const { data: rawCategories = [] } = useQuery({
    queryKey: ["armory-categories"],
    queryFn: async () => (await api.get("equipment/categories/?domain=armory")).data,
  });
  const categories = Array.isArray(rawCategories) ? rawCategories : rawCategories?.results ?? [];

  // Query Armory Items
  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ["armory-items", search, statusFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("domain", "armory");
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      return (await api.get(`equipment/items/?${params.toString()}`)).data;
    },
  });
  const items = Array.isArray(rawItems) ? rawItems : rawItems?.results ?? [];

  // Query active members for custody assignment
  const { data: rawMembers = [] } = useQuery({
    queryKey: ["members-list-simple"],
    queryFn: async () => (await api.get("members/?page_size=200")).data,
  });
  const members = Array.isArray(rawMembers) ? rawMembers : rawMembers?.results ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => api.post("equipment/items/", { ...data, domain: "armory" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["armory-items"] });
      showToast({ title: "تم تسجيل السلاح بنجاح", type: "success" });
      setAddModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      showToast({ title: "خطأ أثناء الحفظ", description: err.response?.data?.detail || "تأكد من صحة البيانات", type: "error" });
    },
  });

  const assignCustodyMutation = useMutation({
    mutationFn: ({ id, data }) => api.post(`equipment/items/${id}/assign-custody/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["armory-items"] });
      showToast({ title: "تم تسليم عهدة السلاح بنجاح", type: "success" });
      setCustodyModalOpen(false);
    },
    onError: (err) => {
      showToast({ title: "خطأ في تسليم العهدة", description: err.response?.data?.detail || "تعذر إتمام الإجراء", type: "error" });
    },
  });

  const releaseCustodyMutation = useMutation({
    mutationFn: ({ id, data }) => api.post(`equipment/items/${id}/release-custody/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["armory-items"] });
      showToast({ title: "تم إرجاع السلاح إلى الخزينة بنجاح", type: "success" });
      setReturnModalOpen(false);
    },
    onError: (err) => {
      showToast({ title: "خطأ في استرجاع العهدة", description: err.response?.data?.detail || "تعذر إتمام الإجراء", type: "error" });
    },
  });

  const markDamagedMutation = useMutation({
    mutationFn: ({ id, data }) => api.post(`equipment/items/${id}/mark-damaged/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["armory-items"] });
      showToast({ title: "تم تسجيل العطل/التلف بنجاح", type: "success" });
      setDamageModalOpen(false);
    },
    onError: (err) => {
      showToast({ title: "خطأ في التوثيق", description: err.response?.data?.detail || "تعذر إتمام الإجراء", type: "error" });
    },
  });

  function resetForm() {
    setFormData({
      name: "",
      category: "",
      serial_number: "",
      caliber: "",
      model_name: "",
      total_quantity: "1",
      available_quantity: "1",
      status: "good",
      notes: "",
    });
  }

  // Filtered items by tab
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeTab === "all") return true;
      if (typeTab === "weapons") return ["rifle", "pistol", "machine_gun"].includes(item.category_type);
      if (typeTab === "ammo") return item.category_type === "ammo";
      if (typeTab === "assigned") return (item.assigned_quantity || 0) > 0;
      if (typeTab === "available") return (item.available_quantity || 0) > 0;
      return true;
    });
  }, [items, typeTab]);

  // Armory KPI Stats
  const stats = useMemo(() => {
    let totalPieces = 0;
    let availablePieces = 0;
    let assignedPieces = 0;
    let damagedPieces = 0;

    items.forEach((item) => {
      totalPieces += item.total_quantity || 0;
      availablePieces += item.available_quantity || 0;
      assignedPieces += item.assigned_quantity || 0;
      damagedPieces += item.damaged_quantity || 0;
    });

    return {
      total: totalPieces,
      available: availablePieces,
      assigned: assignedPieces,
      damaged: damagedPieces,
      totalTypes: items.length,
    };
  }, [items]);

  async function handlePrintSummary() {
    try {
      setIsPrintingSummary(true);
      await openAuthedPdf("reports/inventory/summary/pdf/");
    } catch {
      showToast({ title: "تعذر فتح تقرير التسليح", description: "يرجى المحاولة مجدداً.", type: "error" });
    } finally {
      setIsPrintingSummary(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="قسم التسليح والأسلحة والذخائر"
        subtitle="حصر ومتابعة الأسلحة الفردية، الرشاشات، الذخائر، السجلات الباليستية، وعهد الأفراد والمصفحات"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePrintSummary}
              disabled={isPrintingSummary}
              className="gap-2 font-bold shadow-xs border-slate-200/80 dark:border-white/10"
            >
              <Printer className="h-4.5 w-4.5 text-blue-600" />
              {isPrintingSummary ? "جارٍ التجهيز..." : "طباعة كشف التسليح"}
            </Button>
            <Button onClick={() => setAddModalOpen(true)} className="gap-2 font-bold shadow-sm">
              <Plus className="h-4.5 w-4.5" />
              تسجيل سلاح / ذخيرة
            </Button>
          </div>
        }
      />

      {/* Armory KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي قطع السلاح والذخائر"
          value={stats.total}
          icon={Crosshair}
          description={`${stats.totalTypes} نوع وفئة مسجلة`}
        />
        <StatCard
          title="المتوفر بخزينة السلاح"
          value={stats.available}
          icon={CheckCircle}
          description="جاهز للصرف والتسليم"
          className="border-emerald-200/60 dark:border-emerald-900/30"
        />
        <StatCard
          title="مسلّم كعهدة عملياتية"
          value={stats.assigned}
          icon={UserCheck}
          description="بعهدة الأفراد والمصفحات"
          className="border-blue-200/60 dark:border-blue-900/30"
        />
        <StatCard
          title="تحت الصيانة / تالف"
          value={stats.damaged}
          icon={AlertTriangle}
          description="يحتاج صيانة أو استبعاد"
          className="border-amber-200/60 dark:border-amber-900/30"
        />
      </div>

      {/* Main Table Card */}
      <Card className="border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] shadow-xs">
        <CardContent className="p-5 space-y-4">
          {/* Quick Filter Tabs & Search Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {[
                { id: "all", label: "كافة الأسلحة والذخائر" },
                { id: "weapons", label: "الأسلحة الخفيفة والمتوسطة" },
                { id: "ammo", label: "الذخائر والمقذوفات" },
                { id: "available", label: "المتوفر بالخزينة" },
                { id: "assigned", label: "المسلّم كعهدة" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-caption font-bold transition-all shrink-0 cursor-pointer ${
                    typeTab === tab.id
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="بحث بالسلاح، الرقم، أو العيار..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ps-9 h-9 text-caption rounded-xl"
                />
              </div>

              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-40 h-9 text-caption rounded-xl"
              >
                <option value="">كافة التصنيفات</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_ar}
                  </option>
                ))}
              </Select>

              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-36 h-9 text-caption rounded-xl"
              >
                <option value="">كافة الحالات</option>
                <option value="good">صالح للخدمة</option>
                <option value="maintenance">تحت الصيانة</option>
                <option value="damaged">تالف / معطل</option>
                <option value="retired">مستبعد</option>
              </Select>
            </div>
          </div>

          {/* High-density Armory Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
            <table className="w-full text-start text-body-sm">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-gray-300 font-bold">
                <tr>
                  <th className="py-3 px-3.5 text-start">السلاح / العتاد</th>
                  <th className="py-3 px-3 text-start">النوع والتصنيف</th>
                  <th className="py-3 px-3 text-start">العيار والمواصفة</th>
                  <th className="py-3 px-3 text-start">الرقم التسلسلي</th>
                  <th className="py-3 px-3 text-center">الكمية الكلية</th>
                  <th className="py-3 px-3 text-center">المتوفر</th>
                  <th className="py-3 px-3 text-center">المسلّم كعهدة</th>
                  <th className="py-3 px-3 text-start">العهدة الحالية</th>
                  <th className="py-3 px-3 text-center">الحالة</th>
                  <th className="py-3 px-3.5 text-end">الإجراءات والعمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-slate-400 font-medium">
                      جارٍ تحميل سجلات التسليح...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-slate-400 font-medium">
                      لا توجد أسلحة أو ذخائر مسجلة تطابق خيارات البحث.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const st = STATUS_MAP[item.status] || { label: item.status, variant: "secondary" };
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              <Crosshair className="w-3.5 h-3.5" />
                            </div>
                            <span className="truncate max-w-xs">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="secondary" className="font-bold text-micro">
                            {item.category_name}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-gray-300 font-medium">
                          {item.caliber || item.size_spec || <span className="text-slate-400">—</span>}
                        </td>
                        <td className="py-3 px-3 font-mono text-micro text-slate-900 dark:text-white dir-ltr text-start">
                          {item.serial_number ? (
                            <span className="bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-bold">
                              {item.serial_number}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                          {item.total_quantity}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-micro font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {item.available_quantity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-micro font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            {item.assigned_quantity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-gray-300 text-caption font-medium">
                          {item.assigned_member_name ? (
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                                {item.assigned_member_name}
                              </span>
                              {item.assigned_member_force_number && (
                                <span className="text-micro font-mono text-slate-400">
                                  ({item.assigned_member_force_number})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">خزينة السلاح</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant={st.variant} className="text-micro font-bold">
                            {st.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-3.5 text-end">
                          <div className="flex items-center justify-end gap-1">
                            {/* Handover Action */}
                            {item.available_quantity > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setCustodyData({ member_id: "", quantity: "1", notes: "" });
                                  setCustodyModalOpen(true);
                                }}
                                className="h-7 px-2 text-micro text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg gap-1 font-bold"
                              >
                                <UserCheck className="w-3 h-3" />
                                تسليم عهدة
                              </Button>
                            )}

                            {/* Release Action */}
                            {item.assigned_quantity > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setReturnData({ quantity: "1", notes: "" });
                                  setReturnModalOpen(true);
                                }}
                                className="h-7 px-2 text-micro text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg gap-1 font-bold"
                              >
                                <RotateCcw className="w-3 h-3" />
                                إرجاع
                              </Button>
                            )}

                            {/* Damage/Repair Action */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedItem(item);
                                setDamageData({ quantity: "1", source: item.assigned_quantity > 0 ? "custody" : "warehouse", notes: "" });
                                setDamageModalOpen(true);
                              }}
                              className="h-7 px-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"
                              title="تسجيل صيانة/عطل"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </Button>

                            {/* Voucher & Handover Card Print */}
                            {item.assigned_member_name && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setVoucherModalOpen(true);
                                }}
                                className="h-7 px-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg"
                                title="طباعة بطاقة عهدة السلاح"
                              >
                                <FileCheck2 className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* QR Code */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedItem(item);
                                setQrModalOpen(true);
                              }}
                              className="h-7 px-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg"
                              title="رمز الاستجابة السريعة QR"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Weapon / Munition Dialog */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-lg rounded-[28px] p-6 text-start">
          <DialogHeader>
            <DialogTitle className="text-title font-bold text-slate-900 dark:text-white">
              تسجيل سلاح أو ذخيرة بقسم التسليح
            </DialogTitle>
            <DialogDescription className="text-caption text-slate-500">
              أدخل البيانات الفنية والرقم التسلسلي والعيار لتسجيل القطعة بالخزينة
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(formData);
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label className="text-caption font-bold">
                اسم السلاح / طراز القطعة <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="مثال: بندقية كلاشينكوف AK-47، مسدس جلوك 19، دوشكا 12.7..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-caption font-bold">
                  تصنيف التسليح <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="h-10 rounded-xl"
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
                <Label className="text-caption font-bold">العيار / الذخيرة</Label>
                <Input
                  placeholder="مثال: 7.62x39, 9x19, 12.7x108..."
                  value={formData.caliber}
                  onChange={(e) => setFormData({ ...formData, caliber: e.target.value })}
                  className="h-10 rounded-xl dir-ltr text-end font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-caption font-bold">الرقم التسلسلي للسلاح</Label>
                <Input
                  placeholder="الرقم المنقوش على جسم السلاح"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="h-10 rounded-xl dir-ltr text-end font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-caption font-bold">الموديل / سنة الصنع</Label>
                <Input
                  placeholder="مثال: Type 56, 2022..."
                  value={formData.model_name}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-caption font-bold">الكمية الإجمالية</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.total_quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      total_quantity: e.target.value,
                      available_quantity: e.target.value,
                    })
                  }
                  required
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-caption font-bold">الحالة الفنية</Label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="h-10 rounded-xl"
                >
                  <option value="good">صالح للخدمة</option>
                  <option value="maintenance">تحت الصيانة</option>
                  <option value="damaged">تالف / معطل</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-caption font-bold">ملاحظات والتسجيل الباليستي</Label>
              <Textarea
                placeholder="أي تفاصيل عن الخزن، الملحقات، أو جهة التوريد..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="rounded-xl resize-none text-body-sm"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)} className="rounded-xl px-5 font-bold">
                إلغاء
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="rounded-xl px-6 font-bold">
                {createMutation.isPending ? "جارٍ الحفظ..." : "تسجيل السلاح"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custody Assignment Dialog */}
      <Dialog open={custodyModalOpen} onOpenChange={setCustodyModalOpen}>
        <DialogContent className="max-w-md rounded-[28px] p-6 text-start">
          <DialogHeader>
            <DialogTitle className="text-title font-bold text-slate-900 dark:text-white">
              تسليم عهدة سلاح للفرد
            </DialogTitle>
            <DialogDescription className="text-caption text-slate-500">
              صرف وتسليم ({selectedItem?.name}) كعهدة شخصية مسؤولة
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedItem) return;
              assignCustodyMutation.mutate({
                id: selectedItem.id,
                data: custodyData,
              });
            }}
            className="space-y-4 py-2"
          >
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/30 text-caption font-bold text-amber-950 dark:text-amber-200 space-y-1">
              <div className="flex justify-between">
                <span>السلاح: {selectedItem?.name}</span>
                <span className="font-mono">{selectedItem?.serial_number || ""}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-gray-300">
                <span>المتوفر بالخزينة:</span>
                <span className="font-bold text-emerald-600">{selectedItem?.available_quantity} قطعة</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-caption font-bold">
                الفرد المستلم للعهدة <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={custodyData.member_id}
                onChange={(e) => setCustodyData({ ...custodyData, member_id: e.target.value })}
                required
                className="h-10 rounded-xl"
              >
                <option value="">اختر الفرد من القوة</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.force_number || "بدون رقم"}) - {m.faction_name || ""}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-caption font-bold">الكمية المصروفة</Label>
              <Input
                type="number"
                min="1"
                max={selectedItem?.available_quantity || 1}
                value={custodyData.quantity}
                onChange={(e) => setCustodyData({ ...custodyData, quantity: e.target.value })}
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-caption font-bold">ملاحظات التسليم والمهمة</Label>
              <Textarea
                placeholder="أمر العمليات أو سبب صرف السلاح..."
                value={custodyData.notes}
                onChange={(e) => setCustodyData({ ...custodyData, notes: e.target.value })}
                rows={2}
                className="rounded-xl resize-none text-body-sm"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCustodyModalOpen(false)} className="rounded-xl px-5 font-bold">
                إلغاء
              </Button>
              <Button type="submit" disabled={assignCustodyMutation.isPending} className="rounded-xl px-6 font-bold">
                {assignCustodyMutation.isPending ? "جارٍ التسليم..." : "اعتماد تسليم العهدة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return Custody Dialog */}
      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent className="max-w-md rounded-[28px] p-6 text-start">
          <DialogHeader>
            <DialogTitle className="text-title font-bold text-slate-900 dark:text-white">
              إرجاع السلاح إلى خزينة التسليح
            </DialogTitle>
            <DialogDescription className="text-caption text-slate-500">
              إخلاء طرف الفرد وإرجاع القطعة إلى المستودع الرئيسي
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedItem) return;
              releaseCustodyMutation.mutate({
                id: selectedItem.id,
                data: returnData,
              });
            }}
            className="space-y-4 py-2"
          >
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/30 text-caption font-bold text-emerald-950 dark:text-emerald-200 space-y-1">
              <p>السلاح: {selectedItem?.name}</p>
              <p className="text-slate-600 dark:text-gray-300">
                المسلّم حالياً كعهدة: <span className="font-bold text-blue-600">{selectedItem?.assigned_quantity} قطعة</span>
              </p>
              {selectedItem?.assigned_member_name && (
                <p className="text-slate-600 dark:text-gray-300">
                  بحوزة الفرد: <span className="font-bold text-slate-900 dark:text-white">{selectedItem?.assigned_member_name}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-caption font-bold">الكمية المرجعة</Label>
              <Input
                type="number"
                min="1"
                max={selectedItem?.assigned_quantity || 1}
                value={returnData.quantity}
                onChange={(e) => setReturnData({ ...returnData, quantity: e.target.value })}
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-caption font-bold">ملاحظات الفحص والاستلام</Label>
              <Textarea
                placeholder="حالة السلاح عند الاسترجاع ونظافة السبطانة..."
                value={returnData.notes}
                onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                rows={2}
                className="rounded-xl resize-none text-body-sm"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setReturnModalOpen(false)} className="rounded-xl px-5 font-bold">
                إلغاء
              </Button>
              <Button type="submit" disabled={releaseCustodyMutation.isPending} className="rounded-xl px-6 font-bold bg-emerald-600 hover:bg-emerald-700">
                {releaseCustodyMutation.isPending ? "جارٍ الإرجاع..." : "تأكيد الاستلام بالخزينة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Damage / Maintenance Dialog */}
      <Dialog open={damageModalOpen} onOpenChange={setDamageModalOpen}>
        <DialogContent className="max-w-md rounded-[28px] p-6 text-start">
          <DialogHeader>
            <DialogTitle className="text-title font-bold text-amber-600 dark:text-amber-400">
              تسجيل عطل أو إحالة للصيانة
            </DialogTitle>
            <DialogDescription className="text-caption text-slate-500">
              توثيق تلف أو كسر أو عطل بالسلاح وإحالته لورشة الصيانة الفنية
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedItem) return;
              markDamagedMutation.mutate({
                id: selectedItem.id,
                data: damageData,
              });
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label className="text-caption font-bold">مصدر السلاح المتعطل</Label>
              <Select
                value={damageData.source}
                onChange={(e) => setDamageData({ ...damageData, source: e.target.value })}
                className="h-10 rounded-xl"
              >
                <option value="custody">من عهدة الفرد الحالية</option>
                <option value="warehouse">من خزينة المستودع</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-caption font-bold">الكمية المتعطلة</Label>
              <Input
                type="number"
                min="1"
                value={damageData.quantity}
                onChange={(e) => setDamageData({ ...damageData, quantity: e.target.value })}
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-caption font-bold">تقرير ووصف العطل الفني <span className="text-rose-500">*</span></Label>
              <Textarea
                placeholder="شرح طبيعة العطل (انحشار إبرة، كسر مقبض، عطل بالسبطانة...)"
                value={damageData.notes}
                onChange={(e) => setDamageData({ ...damageData, notes: e.target.value })}
                required
                rows={3}
                className="rounded-xl resize-none text-body-sm"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDamageModalOpen(false)} className="rounded-xl px-5 font-bold">
                إلغاء
              </Button>
              <Button type="submit" disabled={markDamagedMutation.isPending} className="rounded-xl px-6 font-bold bg-amber-600 hover:bg-amber-700">
                {markDamagedMutation.isPending ? "جارٍ الحفظ..." : "إحالة للصيانة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Handover Card Print Modal */}
      {selectedItem && (
        <CustodyHandoverVoucherDialog
          open={voucherModalOpen}
          onOpenChange={setVoucherModalOpen}
          item={selectedItem}
          member={{
            id: selectedItem.assigned_member,
            full_name: selectedItem.assigned_member_name,
            force_number: selectedItem.assigned_member_force_number,
            faction_name: selectedItem.faction_name,
          }}
        />
      )}

      {/* QR Code Dialog */}
      {selectedItem && (
        <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
          <DialogContent className="max-w-sm rounded-[28px] p-6 text-center">
            <DialogHeader>
              <DialogTitle className="text-title font-bold text-slate-900 dark:text-white">
                رمز QR لسلاح: {selectedItem.name}
              </DialogTitle>
              <DialogDescription className="text-caption text-slate-500">
                امسح الرمز عبر كاميرا الماسح للتحقق والتعرف الفوري على السلاح
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center p-4">
              <AssetQRCode
                type="armory"
                id={selectedItem.id}
                code={selectedItem.serial_number || selectedItem.item_code || `ARM-${selectedItem.id}`}
                title={selectedItem.name}
                subtitle={`العيار: ${selectedItem.caliber || '—'} | الرقم: ${selectedItem.serial_number || '—'}`}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default ArmoryPage;
