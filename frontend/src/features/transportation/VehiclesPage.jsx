import React, { useState, useMemo } from "react";
import { useVehicles, useDeleteVehicle } from "./api";
import { VehicleFormDialog } from "./VehicleFormDialog";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardContent } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { FilterBar } from "../../components/ui/FilterBar";
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
  const [factionFilter, setFactionFilter] = useState("all");
  const [weaponFilter, setWeaponFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [tripVoucherOpen, setTripVoucherOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const { data: factions = [] } = useFactions();
  const deleteVehicle = useDeleteVehicle();

  const queryParams = useMemo(() => {
    const params = {};
    if (search) params.search = search;
    if (statusFilter !== "all") params.status = statusFilter;
    if (typeFilter !== "all") params.vehicle_type = typeFilter;
    if (factionFilter !== "all") params.faction = factionFilter;
    if (weaponFilter !== "all") params.has_weapon = weaponFilter;
    return params;
  }, [search, statusFilter, typeFilter, factionFilter, weaponFilter]);

  const { data: vehiclesData, isLoading } = useVehicles(queryParams);
  const vehicles = useMemo(() => {
    if (!vehiclesData) return [];
    return Array.isArray(vehiclesData) ? vehiclesData : vehiclesData.results || [];
  }, [vehiclesData]);

  // Statistics
  const stats = useMemo(() => {
    const total = vehicles.length;
    const ready = vehicles.filter((v) => v.status === "ready").length;
    const maintenance = vehicles.filter((v) => v.status === "maintenance").length;
    const withWeapon = vehicles.filter((v) => v.has_weapon).length;
    return { total, ready, maintenance, withWeapon };
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
      cell: (v) => (
        <div className="space-y-0.5">
          <div className="text-body-sm text-slate-900 dark:text-slate-100 font-semibold">
            {v.faction_name || "—"}
          </div>
          <div className="text-caption text-slate-500">
            {v.driver_name ? `السائق: ${v.driver_name}` : "بدون سائق محدد"}
          </div>
        </div>
      ),
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
              {v.weapon_operator_name ? `الرامي: ${v.weapon_operator_name}` : v.weapon_faction_name || "مخصص للعمليات"}
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
            className="h-8 px-2 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 shadow-2xs"
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
            className="h-8 px-2 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shadow-2xs"
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
            onClick={() => handleEdit(v)}
            title="تعديل"
          >
            <Pencil className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingVehicle(v)}
            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
            title="حذف"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="قسم النقلية والمركبات"
        description="سجل إدارة وتتبع الآليات والمركبات العسكرية والإدارية وتجهيزات التسليح الميداني."
      >
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={handleAdd} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>إضافة مركبة جديدة</span>
          </Button>
        </div>
      </PageHeader>

      {/* KPI Cards (Niqabaty Signature Style) */}
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
          title="تحت الصيانة والإصلاح"
          value={stats.maintenance}
          subtitle="بانتظار قطع الغيار والفحص"
          icon={Wrench}
          variant="default"
          tone="warning"
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
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="بحث باسم المركبة، رقم الهيكل، رقم اللوحة، أو السلاح..."
        filters={[
          {
            key: "status",
            label: "الحالة",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "كافة الحالات" },
              { value: "ready", label: "جاهزة للخدمة" },
              { value: "maintenance", label: "تحت الصيانة" },
              { value: "damaged", label: "معطلة" },
              { value: "retired", label: "خارج الخدمة" },
            ],
          },
          {
            key: "vehicle_type",
            label: "النوع",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: "all", label: "كافة الأنواع" },
              { value: "patrol", label: "دورية / استطلاع" },
              { value: "armored", label: "مصفحة" },
              { value: "pickup", label: "بيك آب" },
              { value: "transport", label: "نقل أفراد" },
              { value: "ambulance", label: "إسعاف" },
              { value: "sedan", label: "صالون / إدارية" },
            ],
          },
          {
            key: "faction",
            label: "الفصيل",
            value: factionFilter,
            onChange: setFactionFilter,
            options: [
              { value: "all", label: "كافة الفصائل" },
              ...factions.map((f) => ({ value: String(f.id), label: f.name_ar })),
            ],
          },
          {
            key: "has_weapon",
            label: "التسليح",
            value: weaponFilter,
            onChange: setWeaponFilter,
            options: [
              { value: "all", label: "الكل" },
              { value: "true", label: "تحمل سلاحاً مثبتاً" },
              { value: "false", label: "بدون سلاح مثبت" },
            ],
          },
        ]}
      />

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
      <VehicleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        vehicle={editingVehicle}
      />

      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={Boolean(deletingVehicle)}
        onOpenChange={(open) => !open && setDeletingVehicle(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <AlertDialogTitle>تأكيد حذف المركبة</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من رغبتك في حذف المركبة ({deletingVehicle?.name}) ورقم الهيكل ({deletingVehicle?.vin_number})؟
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingVehicle(null)}>
              إلغاء
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              تأكيد الحذف
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Official Vehicle Trip Order Voucher Dialog */}
      <VehicleTripVoucherDialog
        vehicle={selectedVehicle}
        open={tripVoucherOpen}
        onOpenChange={setTripVoucherOpen}
      />

      {/* Printable Vehicle QR Tag Modal */}
      <AssetQRCode
        title={selectedVehicle?.name}
        subtitle={`لوحة: ${selectedVehicle?.plate_number || "—"} • هيكل: ${selectedVehicle?.chassis_number || "—"}`}
        code={selectedVehicle?.chassis_number || selectedVehicle?.plate_number || `VEH-${selectedVehicle?.id}`}
        type="vehicle"
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
      />
    </div>
  );
}
