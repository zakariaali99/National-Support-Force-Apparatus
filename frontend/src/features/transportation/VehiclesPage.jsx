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
} from "lucide-react";

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
          <div className="w-9 h-9 rounded-lg bg-navy/5 border border-line flex items-center justify-center text-navy shrink-0">
            <Car className="w-5 h-5 text-gold-dark" />
          </div>
          <div>
            <div className="font-semibold text-navy text-body">{v.name}</div>
            <div className="text-caption text-navy-muted flex items-center gap-2">
              <span>{v.vehicle_type_display || VEHICLE_TYPE_LABELS[v.vehicle_type] || v.vehicle_type}</span>
              {v.model_year && <span>• موديل {v.model_year}</span>}
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
          <div className="font-mono text-body-sm font-semibold text-navy dir-ltr text-right">
            {v.vin_number}
          </div>
          {v.plate_number ? (
            <span className="inline-block px-1.5 py-0.5 rounded bg-surface border border-line text-caption font-mono font-medium text-navy">
              {v.plate_number}
            </span>
          ) : (
            <span className="text-caption text-navy-muted">—</span>
          )}
        </div>
      ),
    },
    {
      header: "تبعية المركبة والسائق",
      accessor: "faction_name",
      cell: (v) => (
        <div className="space-y-1">
          <div className="text-body-sm text-navy font-medium">
            {v.faction_name || "—"}
          </div>
          <div className="text-caption text-navy-muted">
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
          return <span className="text-caption text-navy-muted">لا يوجد سلاح مثبت</span>;
        }
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Badge variant="gold" className="flex items-center gap-1">
                <Crosshair className="w-3 h-3" />
                <span>{v.mounted_weapon_name || "سلاح مثبت"}</span>
              </Badge>
            </div>
            <div className="text-caption text-navy-muted">
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
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(v)}
            title="تعديل"
          >
            <Pencil className="w-4 h-4 text-navy" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingVehicle(v)}
            className="text-danger hover:bg-danger-bg"
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي أسطول المركبات"
          value={stats.total}
          icon={Car}
          variant="default"
        />
        <StatCard
          title="مركبات جاهزة للخدمة"
          value={stats.ready}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="تحت الصيانة والإصلاح"
          value={stats.maintenance}
          icon={Wrench}
          variant="warning"
        />
        <StatCard
          title="مركبات مسلحة"
          value={stats.withWeapon}
          icon={Crosshair}
          variant="gold"
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
            <AlertDialogTitle className="text-navy flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger" />
              <span>تأكيد حذف المركبة</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف المركبة ({deletingVehicle?.name}) ورقم الهيكل ({deletingVehicle?.vin_number})؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingVehicle(null)}>
              إلغاء
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              تأكيد الحذف
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
