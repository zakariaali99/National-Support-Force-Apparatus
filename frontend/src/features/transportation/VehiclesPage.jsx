import React, { useState, useMemo } from "react";
import { useVehicles, useDeleteVehicle, useExternalUnits, useReturnVehicle, useAssignDriver } from "./api";
import { VehicleFormDialog } from "./VehicleFormDialog";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardContent } from "../../components/ui/Card";
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
  Printer,
  Search,
  UserPlus,
  Shield,
} from "lucide-react";
import { VehicleTripVoucherDialog } from "./VehicleTripVoucherDialog";
import { AssetDetailHistoryDialog } from "../../components/equipment/AssetDetailHistoryDialog";
import { printVehiclesSummaryInNewWindow } from "../../lib/printUtils";
import { showToast } from "../../components/ui/Toast";

const VEHICLE_STATUS_BADGES = {
  ready: { variant: "success", label: "جاهزة للخدمة" },
  maintenance: { variant: "warning", label: "تحت الصيانة" },
  damaged: { variant: "danger", label: "معطلة" },
  retired: { variant: "secondary", label: "خارج الخدمة" },
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
  const [activeTab, setActiveTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [affiliationFilter, setAffiliationFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [tripVoucherOpen, setTripVoucherOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Return dialog form state
  const [returnData, setReturnData] = useState({
    driver_id: "",
    odometer: "",
    status: "ready",
    notes: "",
  });

  // Assign driver dialog form state
  const [assignData, setAssignData] = useState({
    driver_id: "",
    driver_name: "",
    driver_force_number: "",
    driver_phone: "",
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
  const assignDriverMutation = useAssignDriver();

  const { data: vehiclesData, isLoading } = useVehicles({ page_size: 300 });
  const vehicles = useMemo(() => {
    if (!vehiclesData) return [];
    return Array.isArray(vehiclesData) ? vehiclesData : vehiclesData.results || [];
  }, [vehiclesData]);

  // Filtered vehicles based on search, tabs, and filters
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // Tab filter
      if (activeTab === "ready" && v.status !== "ready") return false;
      if (activeTab === "maintenance" && v.status !== "maintenance") return false;
      if (activeTab === "damaged" && v.status !== "damaged") return false;
      if (activeTab === "external" && v.affiliation_type !== "external" && !v.external_unit_name) return false;
      if (activeTab === "with_weapon" && !v.has_weapon) return false;

      // Dropdown filters
      if (typeFilter && v.vehicle_type !== typeFilter) return false;
      if (affiliationFilter === "internal" && (v.affiliation_type === "external" || v.external_unit_name)) return false;
      if (affiliationFilter === "external" && v.affiliation_type !== "external" && !v.external_unit_name) return false;

      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = v.name?.toLowerCase().includes(q);
        const matchVin = v.vin_number?.toLowerCase().includes(q);
        const matchPlate = v.plate_number?.toLowerCase().includes(q);
        const matchDriver = v.driver_name?.toLowerCase().includes(q);
        const matchWeapon = v.mounted_weapon_name?.toLowerCase().includes(q);
        const matchExt = v.external_unit_name?.toLowerCase().includes(q);
        if (!matchName && !matchVin && !matchPlate && !matchDriver && !matchWeapon && !matchExt) {
          return false;
        }
      }

      return true;
    });
  }, [vehicles, activeTab, typeFilter, affiliationFilter, search]);

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

  const handleOpenAssign = (vehicle) => {
    setSelectedVehicle(vehicle);
    setAssignData({
      driver_id: "",
      driver_name: "",
      driver_force_number: "",
      driver_phone: "",
      notes: "",
    });
    setAssignOpen(true);
  };

  const handleConfirmAssign = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      await assignDriverMutation.mutateAsync({
        id: selectedVehicle.id,
        data: assignData,
      });
      showToast({ title: "تم تسليم وتكليف السائق بالآلية بنجاح", type: "success" });
      setAssignOpen(false);
    } catch (err) {
      showToast({
        title: "تعذر إتمام التكليف",
        description: err.response?.data?.detail || "تأكد من صحة البيانات",
        type: "error",
      });
    }
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
      showToast({ title: "تم حذف سجل المركبة بنجاح", type: "success" });
      setDeletingVehicle(null);
    }
  };

  const handlePrintSummary = () => {
    printVehiclesSummaryInNewWindow({ vehicles: filteredVehicles });
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Official Action Buttons */}
      <PageHeader
        title="قسم النقلية والآليات"
        description="إدارة وتوثيق أسطول المركبات، تبعية الوحدات الداخلية والخارجية، السائقين، والتسليح الميداني"
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={handlePrintSummary}
              className="gap-2 font-bold shadow-xs border-slate-200/80 dark:border-white/10"
            >
              <Printer className="h-4.5 w-4.5 text-blue-600" />
              <span>طباعة كشف الآليات</span>
            </Button>
            <Button
              variant="primary"
              onClick={handleAdd}
              className="gap-2 font-bold shadow-sm bg-[#2B95E8] hover:bg-blue-600 text-white"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>إضافة مركبة جديدة</span>
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي أسطول المركبات"
          value={stats.total}
          icon={Car}
          description="كافة الآليات المسجلة بالأسطول"
        />
        <StatCard
          title="مركبات جاهزة للخدمة"
          value={stats.ready}
          icon={CheckCircle}
          description="حالة تشغيلية ممتازة للعمليات"
          className="border-emerald-200/60 dark:border-emerald-900/30"
        />
        <StatCard
          title="تبعية لجهات خارجية"
          value={stats.external}
          icon={Globe}
          description="آليات بعهدة وحدات خارجية"
          className="border-purple-200/60 dark:border-purple-900/30"
        />
        <StatCard
          title="مركبات مسلحة"
          value={stats.withWeapon}
          icon={Crosshair}
          description="تحمل تجهيزات تسليح ميداني"
          className="border-amber-200/60 dark:border-amber-900/30"
        />
      </div>

      {/* Main Content Card with Tabs and Executive Table */}
      <Card className="border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-xs">
        <CardContent className="p-5 space-y-4">
          {/* Tabs and Real-time Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-white/5">
            {/* Quick Status Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "all", label: "كافة الآليات" },
                { id: "ready", label: "جاهزة للخدمة" },
                { id: "maintenance", label: "تحت الصيانة" },
                { id: "damaged", label: "معطلة" },
                { id: "external", label: "تبعية خارجية" },
                { id: "with_weapon", label: "مركبات مسلحة" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-caption font-bold transition-all shrink-0 cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filters and Search Input */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <div className="relative w-full sm:w-60">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="بحث بالطراز، الهيكل، اللوحة، السائق..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ps-9 h-9 text-caption rounded-xl"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-40 h-9 px-2.5 text-caption font-medium rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A2038] text-slate-800 dark:text-slate-200"
              >
                <option value="">كافة أنواع المركبات</option>
                {Object.entries(VEHICLE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>

              <select
                value={affiliationFilter}
                onChange={(e) => setAffiliationFilter(e.target.value)}
                className="w-36 h-9 px-2.5 text-caption font-medium rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A2038] text-slate-800 dark:text-slate-200"
              >
                <option value="">كافة التبعيات</option>
                <option value="internal">تابعة للجهاز</option>
                <option value="external">جهة خارجية</option>
              </select>
            </div>
          </div>

          {/* Clean Responsive Executive Data Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
            <table className="w-full text-start text-body-sm table-auto">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-gray-300 font-bold">
                <tr>
                  <th className="py-2.5 px-3 text-start">المركبة والطراز</th>
                  <th className="py-2.5 px-3 text-start">رقم الهيكل واللوحة</th>
                  <th className="py-2.5 px-3 text-start">التبعية والجهة</th>
                  <th className="py-2.5 px-3 text-start">السائق المكلف</th>
                  <th className="py-2.5 px-3 text-start">التسليح المثبت</th>
                  <th className="py-2.5 px-3 text-center">الحالة</th>
                  <th className="py-2.5 px-3 text-end">الإجراءات والعهد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                      جارٍ تحميل بيانات أسطول الآليات...
                    </td>
                  </tr>
                ) : filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-medium space-y-2">
                      <p>لا توجد مركبات مسجلة تطابق خيارات البحث والتصفية.</p>
                      <Button
                        size="sm"
                        onClick={handleAdd}
                        className="font-bold gap-1.5 mx-auto bg-[#2B95E8] hover:bg-blue-600 text-white"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة أول مركبة الآن</span>
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v) => {
                    const statusBadge = VEHICLE_STATUS_BADGES[v.status] || {
                      variant: "secondary",
                      label: v.status,
                    };
                    const isExternal = v.affiliation_type === "external" || Boolean(v.external_unit_name);

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition-colors">
                        {/* Vehicle & Type */}
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <Car className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => handleOpenDetails(v)}
                                className="font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors text-start truncate block max-w-xs cursor-pointer"
                                title="عرض التفاصيل وسلسلة الحيازة والطباعة"
                              >
                                {v.name}
                              </button>
                              <div className="text-micro text-slate-500 font-normal truncate max-w-xs flex items-center gap-1">
                                <span>{v.vehicle_type_display || VEHICLE_TYPE_LABELS[v.vehicle_type] || v.vehicle_type}</span>
                                {v.model_year && <span>• {v.model_year}</span>}
                                {v.color && <span>• {v.color}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* VIN & Plate */}
                        <td className="py-2.5 px-3">
                          <div className="space-y-0.5">
                            <div className="font-mono text-caption font-bold text-slate-800 dark:text-slate-200 dir-ltr text-start">
                              {v.vin_number || "—"}
                            </div>
                            {v.plate_number ? (
                              <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-micro font-mono font-bold text-slate-700 dark:text-slate-300">
                                لوحة: {v.plate_number}
                              </span>
                            ) : (
                              <span className="text-micro text-slate-400">بدون لوحة</span>
                            )}
                          </div>
                        </td>

                        {/* Affiliation */}
                        <td className="py-2.5 px-3">
                          <div>
                            {isExternal ? (
                              <Badge
                                variant="primary"
                                className="gap-1 font-bold text-micro bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40"
                              >
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
                        </td>

                        {/* Current Driver */}
                        <td className="py-2.5 px-3 text-caption font-medium">
                          {v.driver_name ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900 dark:text-white truncate block max-w-[140px]">
                                {v.driver_name}
                              </span>
                              {v.driver_force_number && (
                                <span className="text-micro font-mono text-slate-400">
                                  ر.ع: {v.driver_force_number}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal">المستودع الرئيسي</span>
                          )}
                        </td>

                        {/* Mounted Weapon */}
                        <td className="py-2.5 px-3">
                          {v.has_weapon ? (
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
                          ) : (
                            <span className="text-micro text-slate-400">بدون تسليح</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant={statusBadge.variant} className="text-micro font-bold">
                            {statusBadge.label}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-end">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDetails(v)}
                              className="h-7 px-2 text-micro text-slate-700 dark:text-slate-200 hover:text-blue-600 border-slate-200 dark:border-white/10 rounded-lg gap-1 font-bold"
                              title="سجل الحيازة والتفاصيل والطباعة"
                            >
                              <Eye className="w-3 h-3" />
                              <span>التفاصيل</span>
                            </Button>

                            {!v.assigned_driver && !v.driver_name ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenAssign(v)}
                                className="h-7 px-2 text-micro text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg gap-1 font-bold"
                                title="تسليم وتكليف سائق بالمركبة"
                              >
                                <UserPlus className="w-3 h-3" />
                                <span>إسناد</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenReturn(v)}
                                className="h-7 px-2 text-micro text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg gap-1 font-bold"
                                title="إرجاع واستلام الآلية إلى المرآب"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>إرجاع</span>
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedVehicle(v);
                                setTripVoucherOpen(true);
                              }}
                              className="h-7 px-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg"
                              title="طباعة أمر تحرك وبطاقة تشغيل رسمية"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(v)}
                              className="h-7 px-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                              title="تعديل بيانات الآلية"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingVehicle(v)}
                              className="h-7 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                              title="حذف المركبة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* Vehicle Movement Trip Voucher Modal */}
      {selectedVehicle && (
        <VehicleTripVoucherDialog
          open={tripVoucherOpen}
          onOpenChange={setTripVoucherOpen}
          vehicle={selectedVehicle}
        />
      )}

      {/* Assign Driver Dialog */}
      {selectedVehicle && (
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent className="max-w-md rounded-[28px] p-6 text-start">
            <DialogHeader>
              <DialogTitle className="text-title font-bold text-slate-900 dark:text-white">
                تسليم وتكليف سائق بالمركبة
              </DialogTitle>
              <DialogDescription className="text-caption text-slate-500">
                تسليم الآلية ({selectedVehicle.name}) لسائق مسؤول
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmAssign} className="space-y-4 py-2">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/30 text-caption font-bold text-blue-950 dark:text-blue-200">
                <p>المركبة: {selectedVehicle.name} (لوحة: {selectedVehicle.plate_number || "—"})</p>
                <p className="text-slate-600 dark:text-gray-300 font-normal">رقم الهيكل: {selectedVehicle.vin_number}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-caption font-bold">
                  اختيار السائق من أفراد القوة <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={assignData.driver_id}
                  onChange={(e) => {
                    const mId = e.target.value;
                    const found = members.find((m) => String(m.id) === mId);
                    setAssignData({
                      ...assignData,
                      driver_id: mId,
                      driver_name: found ? found.full_name : "",
                      driver_force_number: found ? found.force_number : "",
                      driver_phone: found ? found.phone_number : "",
                    });
                  }}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A2038] text-body-sm font-medium focus:ring-2 focus:ring-[#2B95E8]"
                >
                  <option value="">اختر الفرد المكلف بالسياقة</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.force_number || "بدون رقم"}) — {m.faction_name || "عام"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-caption font-bold">ملاحظات ومأمورية التسليم</Label>
                <Textarea
                  placeholder="بيانات المهمة أو المأمورية أو القسم المستفيد..."
                  value={assignData.notes}
                  onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })}
                  rows={2}
                  className="rounded-xl resize-none text-body-sm"
                />
              </div>

              <DialogFooter className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssignOpen(false)}
                  className="rounded-xl px-5 font-bold"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={assignDriverMutation.isPending}
                  className="rounded-xl px-6 font-bold bg-[#2B95E8] hover:bg-blue-600 text-white"
                >
                  {assignDriverMutation.isPending ? "جارٍ التكليف..." : "اعتماد التسليم"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                إخلاء طرف السائق الحالي واستلام المركبة بحظيرة الآليات
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmReturn} className="space-y-4 py-2">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/30 text-caption font-bold text-emerald-950 dark:text-emerald-200">
                <p>المركبة: {selectedVehicle.name} (لوحة: {selectedVehicle.plate_number || "—"})</p>
                <p className="text-slate-600 dark:text-gray-300 font-normal">
                  السائق المسجل حالياً: {selectedVehicle.driver_name || "—"}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-caption font-bold">قراءة العداد الحالية (كم)</Label>
                <Input
                  type="number"
                  placeholder="قراءة عداد المسافات عند الاستلام"
                  value={returnData.odometer}
                  onChange={(e) => setReturnData({ ...returnData, odometer: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-caption font-bold">الحالة الفنية عند الاستلام</Label>
                <select
                  value={returnData.status}
                  onChange={(e) => setReturnData({ ...returnData, status: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A2038] text-body-sm font-medium focus:ring-2 focus:ring-[#2B95E8]"
                >
                  <option value="ready">جاهزة للخدمة وسليمة</option>
                  <option value="maintenance">تحتاج صيانة دورية / فحص</option>
                  <option value="damaged">بها أعطال / حادث</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-caption font-bold">ملاحظات الفحص والاستلام</Label>
                <Textarea
                  placeholder="أية ملاحظات على حالة الإطارات، المحرك، الوقود، أو النظافة..."
                  value={returnData.notes}
                  onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                  rows={2}
                  className="rounded-xl resize-none text-body-sm"
                />
              </div>

              <DialogFooter className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReturnOpen(false)}
                  className="rounded-xl px-5 font-bold"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={returnVehicleMutation.isPending}
                  className="rounded-xl px-6 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {returnVehicleMutation.isPending ? "جارٍ الإرجاع..." : "تأكيد الاستلام بالمرآب"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={Boolean(deletingVehicle)} onOpenChange={() => setDeletingVehicle(null)}>
        <AlertDialogContent className="max-w-md rounded-[28px] p-6 text-start">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-title font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>حذف سجل المركبة</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-body-sm text-slate-600 dark:text-gray-300">
              هل أنت متأكد من رغبتك في حذف الآلية (
              <span className="font-bold text-slate-900 dark:text-white">{deletingVehicle?.name}</span>
              )؟ سيتم حذف بيانات المركبة وسجلاتها بشكل نهائي.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeletingVehicle(null)}
              className="rounded-xl px-5 font-bold"
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={deleteVehicle.isPending}
              className="rounded-xl px-6 font-bold"
            >
              {deleteVehicle.isPending ? "جارٍ الحذف..." : "تأكيد الحذف"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
