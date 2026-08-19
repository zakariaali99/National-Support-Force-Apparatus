import React, { useState, useMemo } from "react";
import { useVehicles, useDeleteVehicle, useExternalUnits } from "./api";
import { VehicleFormDialog } from "./VehicleFormDialog";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardContent } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { FilterBar } from "../../components/ui/FilterBar";
import { Select } from "../../components/ui/Select";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "../../components/ui/AlertDialog";
import { useFactions } from "../organization/api";
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
  QrCode,
  Building2,
  Globe,
} from "lucide-react";
import { VehicleTripVoucherDialog } from "./VehicleTripVoucherDialog";
import { AssetQRCode } from "../../components/qr/AssetQRCode";

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
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const { data: factions = [] } = useFactions();
  const { data: externalUnits = [] } = useExternalUnits({ is_active: true });
  const deleteVehicle = useDeleteVehicle();

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-body-sm">{v.name}</div>
            <div className="text-caption text-slate-500 flex items-center gap-2">
              <span>{v.vehicle_type_display || VEHICLE_TYPE_LABELS[v.vehicle_type] || v.vehicle_type}</span>
              {v.model_year && <span>• موديل {v.model_year}</span>}
              {v.color && <span>• {v.color}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "رقم الهيكل واللوحة",
      accessor: "vin_number",
      cell: (v) => (
        <div className="space-y-0.5">
          <div className="font-mono text-body-sm font-semibold text-slate-900 dark:text-slate-100 dir-ltr text-right">
            {v.vin_number}
          </div>
          {v.plate_number ? (
            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-caption font-mono font-semibold text-slate-700 dark:text-slate-300">
              {v.plate_number}
            </span>
          ) : (
            <span className="text-caption text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      header: "تبعية المركبة والسائق",
      accessor: "faction_name",
      cell: (v) => {
        const isExternal = v.affiliation_type === "external" || Boolean(v.external_unit_name);
        return (
          <div className="space-y-1">
            <div>
              {isExternal ? (
                <Badge variant="primary" className="gap-1 font-bold text-micro bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40">
                  <Globe className="w-3 h-3" />
                  <span>جهة خارجية: {v.external_unit_name || "وحدة خارجية"}</span>
                </Badge>
              ) : (
                <Badge variant="success" className="gap-1 font-bold text-micro">
                  <Building2 className="w-3 h-3" />
                  <span>الجهاز: {v.faction_name || "عام"}</span>
                </Badge>
              )}
            </div>
            <div className="text-caption text-slate-500 font-medium">
              {v.driver_name ? `السائق: ${v.driver_name}` : "بدون سائق محدد"}
            </div>
          </div>
        );
      },
    },
    {
      header: "السلاح المثبت (قسم التسليح)",
      accessor: "has_weapon",
      cell: (v) => {
        if (!v.has_weapon) {
          return <span className="text-caption text-slate-400">لا يوجد سلاح مثبت</span>;
        }
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Badge variant="gold" className="flex items-center gap-1">
                <Crosshair className="w-3 h-3" />
                <span>{v.mounted_weapon_name || "سلاح مثبت"}</span>
              </Badge>
            </div>
            <div className="text-caption text-slate-500 font-mono">
              {v.weapon_operator_name
                ? `الرامي: ${v.weapon_operator_name}`
                : v.weapon_external_unit_name
                ? `تبعية: ${v.weapon_external_unit_name}`
                : v.weapon_faction_name || "مخصص للعمليات"}
            </div>
          </div>
        );
      },
    },
    {
      header: "الحالة التشغيلية",
      accessor: "status",
      cell: (v) => {
        const badgeInfo = VEHICLE_STATUS_BADGES[v.status] || { variant: "neutral", label: v.status };
        return <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>;
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
            className="h-7.5 px-2 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 shadow-2xs text-caption font-semibold"
            onClick={() => {
              setSelectedVehicle(v);
              setTripVoucherOpen(true);
            }}
            title="طباعة أمر تحرك وبطاقة تشغيل للمركبة"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7.5 px-2 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shadow-2xs text-caption font-semibold"
            onClick={() => {
              setSelectedVehicle(v);
              setQrModalOpen(true);
            }}
            title="توليد ملصق QR للمركبة"
          >
            <QrCode className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7.5 px-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            onClick={() => handleEdit(v)}
            title="تعديل بيانات المركبة"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7.5 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
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
      <Card>
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

      {/* Asset QR Code Modal */}
      {selectedVehicle && (
        <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
          <DialogContent className="max-w-sm rounded-[28px] p-6 text-center">
            <DialogHeader>
              <DialogTitle className="text-title font-bold text-slate-900 dark:text-white">
                رمز QR لمركبة: {selectedVehicle.name}
              </DialogTitle>
              <DialogDescription className="text-caption text-slate-500">
                امسح الرمز عبر ماسح الكاميرا للحصول على أمر التحرك والبيانات الميدانية
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center p-4">
              <AssetQRCode
                type="vehicle"
                id={selectedVehicle.id}
                code={selectedVehicle.vin_number || selectedVehicle.plate_number || `VEH-${selectedVehicle.id}`}
                title={selectedVehicle.name}
                subtitle={`الهيكل: ${selectedVehicle.vin_number} | اللوحة: ${selectedVehicle.plate_number || '—'}`}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
