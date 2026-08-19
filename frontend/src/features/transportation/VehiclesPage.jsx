import React, { useState, useMemo } from "react";
import { useVehicles, useDeleteVehicle, useExternalUnits, useReturnVehicle, useAssignDriver } from "./api";
import { VehicleFormDialog } from "./VehicleFormDialog";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardContent } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { FilterBar } from "../../components/ui/FilterBar";
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Textarea } from "../../components/ui/Textarea";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/Dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "../../components/ui/AlertDialog";
import { useFactions } from "../organization/api";
import { useMembers } from "../members/api";
import {
  Car,
  Plus,
  Crosshair,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Pencil,
  Trash2,
  FileCheck2,
  Building2,
  Globe,
  RotateCcw,
  Eye,
  FileText,
} from "lucide-react";
import { VehicleTripVoucherDialog } from "./VehicleTripVoucherDialog";
import { AssetDetailHistoryDialog } from "../../components/equipment/AssetDetailHistoryDialog";
import { showToast } from "../../components/ui/Toast";

const VEHICLE_STATUS_BADGES = {
  ready: { variant: "success", label: "جاهزة للخدمة" },
  maintenance: { variant: "warning", label: "تحت الصيانة" },
  damaged: { variant: "danger", label: "معطلة" },
  retired: { variant: "neutral", label: "خارج الخدمة" },
};

const VEHICLE_TYPE_LABELS = {
  patrol: "دورية / استطلاع",
  armored: "مصفحة",
  pickup: "بيك آب / دفع رباعي",
  transport: "نقل أفراد",
  truck: "شاحنة نقل / إمداد",
  ambulance: "إسعاف",
  sedan: "صالون / إدارية",
  other: "أخرى",
};

export default function VehiclesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [affiliationFilter, setAffiliationFilter] = useState("all");
  const [factionFilter, setFactionFilter] = useState("all");
  const [externalUnitFilter, setExternalUnitFilter] = useState("all");
  const [weaponFilter, setWeaponFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [tripVoucherOpen, setTripVoucherOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Return dialog form state
  const [returnData, setReturnData] = useState({
    driver_id: "",
    odometer: "",
    status: "ready",
    notes: "",
  });

  const { data: factionsRaw = [] } = useFactions();
  const { data: externalUnitsRaw = [] } = useExternalUnits({ is_active: true });
  const { data: membersRaw } = useMembers({ page_size: 200 });

  const factions = Array.isArray(factionsRaw) ? factionsRaw : factionsRaw?.results || [];
  const externalUnits = Array.isArray(externalUnitsRaw) ? externalUnitsRaw : externalUnitsRaw?.results || [];
  const members = Array.isArray(membersRaw) ? membersRaw : membersRaw?.results || [];

  const deleteVehicle = useDeleteVehicle();
  const returnVehicleMutation = useReturnVehicle();

  const queryParams = useMemo(() => {
    const params = {};
    if (search) params.search = search;
    if (statusFilter !== "all") params.status = statusFilter;
    if (typeFilter !== "all") params.vehicle_type = typeFilter;
    if (affiliationFilter !== "all") params.affiliation_type = affiliationFilter;
    if (factionFilter !== "all") params.faction = factionFilter;
    if (externalUnitFilter !== "all") params.external_unit = externalUnitFilter;
    if (weaponFilter !== "all") params.has_weapon = weaponFilter;
    return params;
  }, [search, statusFilter, typeFilter, affiliationFilter, factionFilter, externalUnitFilter, weaponFilter]);

  const { data: vehiclesData, isLoading } = useVehicles(queryParams);
  const vehicles = useMemo(() => {
    if (!vehiclesData) return [];
    return Array.isArray(vehiclesData) ? vehiclesData : vehiclesData.results || [];
  }, [vehiclesData]);

  // Statistics
  const stats = useMemo(() => {
    const total = vehicles.length;
    const ready = vehicles.filter((v) => v.status === "ready").length;
    const external = vehicles.filter((v) => v.affiliation_type === "external" || Boolean(v.external_unit_name)).length;
    const withWeapon = vehicles.filter((v) => v.has_weapon).length;
    return { total, ready, external, withWeapon };
  }, [vehicles]);

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingVehicle(null);
    setFormOpen(true);
  };

  const handleOpenDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
    setDetailsOpen(true);
  };

  const handleOpenReturn = (vehicle) => {
    setSelectedVehicle(vehicle);
    setReturnData({
      driver_id: vehicle.assigned_driver ? String(vehicle.assigned_driver) : "",
      odometer: "",
      status: "ready",
      notes: "",
    });
    setReturnOpen(true);
  };

  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      await returnVehicleMutation.mutateAsync({
        id: selectedVehicle.id,
        data: returnData,
      });
      showToast({ title: "تم إرجاع واستلام الآلية بنجاح", type: "success" });
      setReturnOpen(false);
    } catch (err) {
      showToast({
        title: "تعذر إتمام الإرجاع",
        description: err.response?.data?.detail || "تأكد من صحة البيانات",
        type: "error",
      });
    }
  };

  const confirmDelete = async () => {
    if (deletingVehicle) {
      await deleteVehicle.mutateAsync(deletingVehicle.id);
      setDeletingVehicle(null);
    }
  };

  const columns = [
    {
      header: "المركبة / الطراز",
      accessor: "name",
      cell: (v) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
            <Car className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => handleOpenDetails(v)}
              className="font-bold text-slate-900 dark:text-slate-100 text-body-sm hover:text-blue-600 transition-colors text-start truncate block max-w-[180px] cursor-pointer"
              title="عرض التفاصيل وسلسلة الحيازة"
            >
              {v.name}
            </button>
            <div className="text-micro text-slate-500 flex items-center gap-1.5 truncate">
              <span>{v.vehicle_type_display || VEHICLE_TYPE_LABELS[v.vehicle_type] || v.vehicle_type}</span>
              {v.model_year && <span>• {v.model_year}</span>}
              {v.color && <span>• {v.color}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "الهيكل واللوحة",
      accessor: "vin_number",
      cell: (v) => (
        <div className="space-y-0.5">
          <div className="font-mono text-caption font-bold text-slate-900 dark:text-slate-100 dir-ltr text-start">
            {v.vin_number}
          </div>
          {v.plate_number ? (
            <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-micro font-mono font-bold text-slate-700 dark:text-slate-300">
              {v.plate_number}
            </span>
          ) : (
            <span className="text-micro text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      header: "التبعية والسائق الحالي",
      accessor: "faction_name",
      cell: (v) => {
        const isExternal = v.affiliation_type === "external" || Boolean(v.external_unit_name);
        return (
          <div className="space-y-0.5">
            <div>
              {isExternal ? (
                <Badge variant="primary" className="gap-1 font-bold text-micro bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40">
                  <Globe className="w-3 h-3" />
                  <span>{v.external_unit_name || "جهة خارجية"}</span>
                </Badge>
              ) : (
                <Badge variant="success" className="gap-1 font-bold text-micro">
                  <Building2 className="w-3 h-3" />
                  <span>{v.faction_name || "عام"}</span>
                </Badge>
              )}
            </div>
            <div className="text-caption font-medium text-slate-700 dark:text-gray-300 truncate max-w-[150px]">
              {v.driver_name ? `السائق: ${v.driver_name}` : <span className="text-slate-400 font-normal">المستودع الرئيسي</span>}
            </div>
          </div>
        );
      },
    },
    {
      header: "السلاح المثبت",
      accessor: "has_weapon",
      cell: (v) => {
        if (!v.has_weapon) {
          return <span className="text-micro text-slate-400">لا يوجد</span>;
        }
        return (
          <div className="space-y-0.5">
            <Badge variant="gold" className="flex items-center gap-1 font-bold text-micro w-fit">
              <Crosshair className="w-3 h-3" />
              <span>{v.mounted_weapon_name || "سلاح مثبت"}</span>
            </Badge>
            {v.weapon_operator_name && (
              <div className="text-micro text-slate-500 font-medium">
                الرامي: {v.weapon_operator_name}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "الحالة",
      accessor: "status",
      cell: (v) => {
        const badgeInfo = VEHICLE_STATUS_BADGES[v.status] || { variant: "neutral", label: v.status };
        return <Badge variant={badgeInfo.variant} className="text-micro font-bold">{badgeInfo.label}</Badge>;
      },
    },
    {
      header: "الإجراءات",
      id: "actions",
      cell: (v) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-micro font-bold gap-1"
            onClick={() => handleOpenDetails(v)}
            title="سجل الحيازة والبيانات التفصيلية"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>التفاصيل</span>
          </Button>

          {v.assigned_driver && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-micro font-bold gap-1"
              onClick={() => handleOpenReturn(v)}
              title="إرجاع واستلام الآلية إلى المرآب"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إرجاع</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-micro font-semibold"
            onClick={() => {
              setSelectedVehicle(v);
              setTripVoucherOpen(true);
            }}
            title="طباعة أمر تحرك وبطاقة تشغيل"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            onClick={() => handleEdit(v)}
            title="تعديل بيانات المركبة"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            onClick={() => setDeletingVehicle(v)}
            title="حذف المركبة"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="قسم النقلية والآليات"
        subtitle="إدارة وتوثيق أسطول المركبات، تبعية الوحدات الداخلية والخارجية، السائقين، والتسليح الميداني"
      >
        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            onClick={handleAdd}
            className="flex items-center gap-2 text-body-sm font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مركبة جديدة</span>
          </Button>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="إجمالي أسطول المركبات"
          value={stats.total}
          subtitle="كافة الآليات التكتيكية والإدارية"
          icon={Car}
          variant="navy"
        />
        <StatCard
          title="مركبات جاهزة للخدمة"
          value={stats.ready}
          subtitle="حالة تشغيلية ممتازة"
          icon={CheckCircle}
          variant="default"
          tone="success"
        />
        <StatCard
          title="تبعية لجهات خارجية"
          value={stats.external}
          subtitle="آليات بتبعية وإعارة خارجية"
          icon={Globe}
          variant="default"
          tone="primary"
        />
        <StatCard
          title="مركبات مسلحة"
          value={stats.withWeapon}
          subtitle="تحمل تجهيزات تسليح ميداني"
          icon={Crosshair}
          variant="gradient"
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="بحث باسم المركبة، رقم الهيكل، رقم اللوحة، أو السلاح..."
      >
        <Select
          label="نوع التبعية"
          value={affiliationFilter}
          onValueChange={setAffiliationFilter}
          options={[
            { value: "all", label: "كافة التبعيات" },
            { value: "internal", label: "تابعة للجهاز" },
            { value: "external", label: "تابعة لجهة خارجية" },
          ]}
        />
        {affiliationFilter === "external" ? (
          <Select
            label="الجهة الخارجية"
            value={externalUnitFilter}
            onValueChange={setExternalUnitFilter}
            options={[
              { value: "all", label: "كافة الجهات الخارجية" },
              ...externalUnits.map((u) => ({ value: String(u.id), label: u.name_ar })),
            ]}
          />
        ) : (
          <Select
            label="الفصيل الداخلي"
            value={factionFilter}
            onValueChange={setFactionFilter}
            options={[
              { value: "all", label: "كافة الفصائل" },
              ...factions.map((f) => ({ value: String(f.id), label: f.name_ar })),
            ]}
          />
        )}
        <Select
          label="الحالة التشغيلية"
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={[
            { value: "all", label: "كافة الحالات" },
            { value: "ready", label: "جاهزة للخدمة" },
            { value: "maintenance", label: "تحت الصيانة" },
            { value: "damaged", label: "معطلة" },
            { value: "retired", label: "خارج الخدمة" },
          ]}
        />
        <Select
          label="نوع المركبة"
          value={typeFilter}
          onValueChange={setTypeFilter}
          options={[
            { value: "all", label: "كافة الأنواع" },
            { value: "patrol", label: "دورية / استطلاع" },
            { value: "armored", label: "مصفحة" },
            { value: "pickup", label: "بيك آب" },
            { value: "transport", label: "نقل أفراد" },
            { value: "ambulance", label: "إسعاف" },
            { value: "sedan", label: "صالون / إدارية" },
          ]}
        />
        <Select
          label="حالة التسليح"
          value={weaponFilter}
          onValueChange={setWeaponFilter}
          options={[
            { value: "all", label: "الكل" },
            { value: "true", label: "تحمل سلاحاً مثبتاً" },
            { value: "false", label: "بدون سلاح مثبت" },
          ]}
        />
      </FilterBar>

      {/* Data Table */}
      <Card className="border border-slate-200/80 dark:border-white/10 shadow-xs">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={vehicles}
            loading={isLoading}
            emptyMessage="لا توجد مركبات مسجلة تطابق معايير البحث."
          />
        </CardContent>
      </Card>

      {/* Vehicle Form Modal */}
      {formOpen && (
        <VehicleFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          vehicle={editingVehicle}
        />
      )}

      {/* Vehicle Details & Possession Chain Modal */}
      {selectedVehicle && (
        <AssetDetailHistoryDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          item={selectedVehicle}
          type="vehicle"
        />
      )}

      {/* Return Vehicle Dialog */}
      {selectedVehicle && (
        <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
          <DialogContent className="max-w-md rounded-[28px] p-6 text-start">
            <DialogHeader>
              <DialogTitle className="text-title font-bold text-slate-900 dark:text-white">
                إرجاع واستلام الآلية إلى المرآب
              </DialogTitle>
              <DialogDescription className="text-caption text-slate-500">
                تسجيل إعادة المركبة ({selectedVehicle.name}) وإخلاء طرف السائق
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmReturn} className="space-y-4 py-2">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/30 text-caption font-bold text-blue-950 dark:text-blue-200 space-y-1">
                <p>المركبة: {selectedVehicle.name} ({selectedVehicle.plate_number || selectedVehicle.vin_number})</p>
                <p className="text-slate-600 dark:text-gray-300">
                  السائق المسجل: <span className="font-bold text-slate-900 dark:text-white">{selectedVehicle.driver_name || "غير محدد"}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-caption font-bold">
                  الشخص / السائق المُرجِع للآلية <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={returnData.driver_id}
                  onChange={(e) => setReturnData({ ...returnData, driver_id: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A2038] text-body-sm font-medium focus:ring-2 focus:ring-[#2B95E8]"
                  required
                >
                  <option value="">اختر الفرد المُرجِع</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.force_number || "بدون رقم"}) — {m.faction_name || ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-caption font-bold">قراءة العداد (كم)</Label>
                  <Input
                    type="number"
                    placeholder="مثال: 45200"
                    value={returnData.odometer}
                    onChange={(e) => setReturnData({ ...returnData, odometer: e.target.value })}
                    className="h-10 rounded-xl font-mono dir-ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-caption font-bold">الحالة الفنية للمركبة</Label>
                  <select
                    value={returnData.status}
                    onChange={(e) => setReturnData({ ...returnData, status: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A2038] text-body-sm font-medium focus:ring-2 focus:ring-[#2B95E8]"
                  >
                    <option value="ready">جاهزة وسليمة للخدمة</option>
                    <option value="maintenance">تحتاج صيانة دورية</option>
                    <option value="damaged">بها أعطال / أضرار</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-caption font-bold">ملاحظات الاستلام وحالة الهيكل</Label>
                <Textarea
                  placeholder="مستوى الوقود، نظافة المركبة، أية ملاحظات ميكانيكية..."
                  value={returnData.notes}
                  onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                  rows={2}
                  className="rounded-xl resize-none text-body-sm"
                />
              </div>

              <DialogFooter className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setReturnOpen(false)} className="rounded-xl px-5 font-bold">
                  إلغاء
                </Button>
                <Button type="submit" disabled={returnVehicleMutation.isPending} className="rounded-xl px-6 font-bold bg-emerald-600 hover:bg-emerald-700">
                  {returnVehicleMutation.isPending ? "جارٍ التوثيق..." : "تأكيد الاستلام بالمرآب"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={Boolean(deletingVehicle)}
        onOpenChange={(open) => !open && setDeletingVehicle(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <AlertDialogTitle>حذف المركبة من الأسطول</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              هل أنت متأكد من حذف المركبة{" "}
              <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                "{deletingVehicle?.name}"
              </strong>{" "}
              (رقم الهيكل: {deletingVehicle?.vin_number})؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingVehicle(null)}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={deleteVehicle.isPending}
            >
              {deleteVehicle.isPending ? "جارٍ الحذف..." : "تأكيد الحذف"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Trip Voucher / Daily Assignment Modal */}
      {selectedVehicle && (
        <VehicleTripVoucherDialog
          open={tripVoucherOpen}
          onOpenChange={setTripVoucherOpen}
          vehicle={selectedVehicle}
        />
      )}
    </div>
  );
}
