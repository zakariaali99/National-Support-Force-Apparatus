import { useState, useMemo } from "react";
import {
  Eye,
  Shield,
  User,
  Clock,
  Globe,
  Laptop,
  FileText,
  Info,
  Search,
  FileSpreadsheet,
  Package,
  Printer,
  RotateCcw,
  Lock,
  MapPin,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { DataTable } from "../../components/ui/DataTable";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Pagination } from "../../components/ui/Pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/Dialog";
import { formatDate, formatDateTime, formatTime } from "../../lib/format";
import { showToast } from "../../components/ui/Toast";
import { downloadAuthedFile } from "../reports/api";
import { useAuth } from "../auth/AuthContext";
import { useActivityLog, useAuditStats } from "./api";

const ACTION_LABELS = {
  attendance_record_bulk: "تسجيل تمام مجمع",
  attendance_record: "تسجيل تمام فردي",
  attendance_bulk_save: "اعتماد كشف التمام",
  shift_roster_update: "تعديل جدول المناوبات",
  document_download: "تحميل مستند",
  document_upload: "رفع مستند",
  print: "طباعة تقرير",
  export: "تصدير بيانات",
  login_failed: "محاولة دخول فاشلة",
  login_success: "تسجيل دخول ناجح",
  logout: "تسجيل خروج",
  backup_run: "تشغيل نسخة احتياطية",
  backup_download: "تحميل نسخة احتياطية",
  backup_restore: "استرجاع نسخة احتياطية",
  inventory_create: "تسجيل عتاد بالجرد",
  inventory_custody_assign: "تسليم عهدة فردية",
  inventory_custody_release: "إرجاع عهدة للمخزن",
  member_create: "إضافة فرد جديد",
  member_update: "تعديل بيانات فرد",
  member_delete: "حذف سجل فرد",
  member_note_create: "إضافة ملاحظة إدارية",
  member_note_delete: "حذف ملاحظة إدارية",
  member_task_assign: "إسناد وتكليف مهمة",
  member_task_update: "تحديث حالة مهمة",
  member_task_delete: "حذف مهمة",
  member_evaluation_create: "تسجيل تقييم كفاءة",
  vacation_request_create: "تقديم طلب إجازة",
  vacation_request_approve: "اعتماد وموافقة إجازة",
  vacation_request_reject: "رفض طلب إجازة",
  vacation_balance_adjust: "تعديل رصيد إجازات",
  vehicle_create: "إضافة مركبة للأسطول",
  vehicle_update: "تعديل بيانات مركبة",
  vehicle_trip: "إصدار أمر تحرك",
  vehicle_delete: "حذف سجل مركبة",
  external_unit_create: "إضافة وحدة/جهة خارجية",
  external_unit_update: "تعديل وحدة/جهة خارجية",
  external_unit_delete: "حذف وحدة/جهة خارجية",
  armory_weapon_create: "تسجيل سلاح بقسم التسليح",
  armory_weapon_update: "تعديل بيانات سلاح",
  armory_weapon_delete: "حذف سجل سلاح",
  inventory_category_create: "إضافة تصنيف مخزني",
  inventory_category_update: "تعديل تصنيف مخزني",
  inventory_category_delete: "حذف تصنيف مخزني",
  inventory_mark_damaged: "تسجيل تالف/مكهن",
  attendance_update_member: "تعديل تمام فرد",
  attendance_update_subset: "تعديل جزئي للتمام",
  attendance_record_bulk: "اعتماد كشف التمام",
  attendance_record: "تسجيل تمام",
  attendance_bulk_save: "حفظ كشف التمام",
  shift_roster_update: "تعديل جدول المناوبات",
};

const ACTION_VARIANTS = {
  login_failed: "danger",
  login_success: "success",
  logout: "secondary",
  document_download: "info",
  document_upload: "primary",
  print: "primary",
  export: "secondary",
  backup_run: "success",
  backup_download: "warning",
  backup_restore: "danger",
  inventory_create: "success",
  inventory_custody_assign: "primary",
  inventory_custody_release: "warning",
  inventory_mark_damaged: "danger",
  inventory_category_create: "success",
  inventory_category_update: "primary",
  inventory_category_delete: "danger",
  armory_weapon_create: "success",
  armory_weapon_update: "primary",
  armory_weapon_delete: "danger",
  external_unit_create: "success",
  external_unit_update: "primary",
  external_unit_delete: "danger",
  member_create: "success",
  member_update: "primary",
  member_delete: "danger",
  member_note_create: "info",
  member_note_delete: "danger",
  member_task_assign: "gold",
  member_task_update: "primary",
  member_task_delete: "danger",
  member_evaluation_create: "success",
  vacation_request_create: "warning",
  vacation_request_approve: "success",
  vacation_request_reject: "danger",
  vacation_balance_adjust: "info",
  vehicle_create: "success",
  vehicle_update: "primary",
  vehicle_trip: "gold",
  vehicle_delete: "danger",
  attendance_update_member: "warning",
  attendance_update_subset: "primary",
  attendance_record_bulk: "success",
  attendance_record: "info",
  attendance_bulk_save: "success",
  shift_roster_update: "primary",
};

const TARGET_MODEL_LABELS = {
  DailyAttendance: "التمام اليومي",
  DailyAttendanceRecord: "سجل التمام",
  ShiftRoster: "جدول المناوبات",
  Member: "شؤون الأفراد والضباط",
  MemberDocument: "وثائق ومستندات الأفراد",
  MemberPledge: "تعهدات والتزامات الأفراد",
  InventoryItem: "العتاد والمخازن والتسليح",
  InventoryCategory: "تصنيفات العتاد والتسليح",
  InventoryCustody: "سجلات العهدة",
  Vehicle: "قسم النقلية والآليات",
  VehicleTripVoucher: "أوامر تحرك المركبات",
  ExternalUnit: "الوحدات والجهات الخارجية",
  User: "حسابات المستخدمين",
  Role: "الأدوار والصلاحيات",
  Backup: "النسخ الاحتياطي والأمان",
  Auth: "جلسات المصادقة والدخول",
  all: "كافة الأقسام والمكونات",
  member: "شؤون الأفراد والضباط",
  inventory_item: "العتاد والمخازن",
  vehicle: "قسم النقلية والآليات",
  attendance: "التمام والانضباط",
  backup: "النسخ الاحتياطي والأمان",
  auth: "جلسات الدخول والمصادقة",
};

function formatActionText(action) {
  if (!action) return "إجراء عام";
  return ACTION_LABELS[action] || action.replace(/_/g, " ");
}

function formatTargetText(model, metadata) {
  if (metadata?.item_name) return metadata.item_name;
  if (metadata?.target_name) return metadata.target_name;
  if (!model) return "النظام العام";
  return TARGET_MODEL_LABELS[model] || model;
}

function isPrivateOrLocalIp(ip) {
  if (!ip) return true;
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.3")
  );
}

const ACTION_OPTIONS = [
  { value: "all", label: "كل أنواع الإجراءات" },
  { value: "attendance_update_member", label: "تعديل تمام فرد" },
  { value: "attendance_update_subset", label: "تعديل جزئي للتمام" },
  { value: "attendance_record_bulk", label: "اعتماد كشف التمام" },
  { value: "inventory_custody_assign", label: "تسليم عهدة فردية" },
  { value: "inventory_custody_release", label: "إرجاع عهدة للمخزن" },
  { value: "inventory_create", label: "تسجيل عتاد بالجرد" },
  { value: "vehicle_trip", label: "إصدار أمر تحرك" },
  { value: "document_download", label: "تحميل مستند" },
  { value: "print", label: "طباعة تقرير" },
  { value: "export", label: "تصدير بيانات" },
  { value: "backup_run", label: "تشغيل نسخة احتياطية" },
  { value: "backup_download", label: "تحميل نسخة احتياطية" },
  { value: "login_failed", label: "محاولة دخول فاشلة" },
  { value: "member_create", label: "إضافة فرد جديد" },
  { value: "member_update", label: "تعديل بيانات فرد" },
];

const TARGET_MODELS = [
  { value: "all", label: "كافة الأقسام والمكونات" },
  { value: "attendance", label: "التمام والانضباط" },
  { value: "member", label: "شؤون الأفراد والضباط" },
  { value: "inventory_item", label: "العتاد والمخازن" },
  { value: "vehicle", label: "قسم النقلية والآليات" },
  { value: "backup", label: "النسخ الاحتياطي والأمان" },
  { value: "auth", label: "جلسات الدخول والمصادقة" },
];

export function AuditPage() {
  const { user } = useAuth();
  const isSuperUser = Boolean(user?.is_superuser);

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [targetModel, setTargetModel] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const queryParams = useMemo(() => {
    const params = {
      page,
      page_size: pageSize,
    };
    if (search.trim()) params.search = search.trim();
    if (action !== "all") params.action = action;
    if (targetModel !== "all") params.target_model = targetModel;
    return params;
  }, [search, action, targetModel, page, pageSize]);

  const { data, isLoading } = useActivityLog(queryParams);
  const { data: statsData } = useAuditStats();

  const rows = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const handleExportCsv = async () => {
    try {
      showToast("جاري تجهيز وتنزيل سجل التدقيق الأمني...", "info");
      let url = "audit/activity/export-csv/";
      const queryParts = [];
      if (search.trim()) queryParts.push(`search=${encodeURIComponent(search.trim())}`);
      if (action !== "all") queryParts.push(`action=${encodeURIComponent(action)}`);
      if (targetModel !== "all") queryParts.push(`target_model=${encodeURIComponent(targetModel)}`);
      if (queryParts.length > 0) url += `?${queryParts.join("&")}`;

      await downloadAuthedFile(url, `nasf_audit_log_${new Date().toISOString().split("T")[0]}.csv`);
      showToast("تم تنزيل سجل التدقيق بنجاح", "success");
    } catch {
      showToast("تعذر تصدير سجل التدقيق", "error");
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setAction("all");
    setTargetModel("all");
    setPage(1);
  };

  const columns = [
    {
      key: "date",
      label: "التاريخ والوقت",
      className: "w-40",
      render: (r) => (
        <div className="space-y-0.5 font-mono">
          <p className="text-body-sm font-bold text-slate-900 dark:text-white" dir="ltr">
            {formatDate(r.created_at)}
          </p>
          <p className="text-caption text-slate-500 dark:text-gray-400 font-medium" dir="ltr">
            {formatTime(r.created_at)}
          </p>
        </div>
      ),
    },
    {
      key: "action",
      label: "نوع الإجراء",
      className: "w-40",
      render: (r) => (
        <Badge variant={ACTION_VARIANTS[r.action] || "outline"} className="font-bold">
          {formatActionText(r.action)}
        </Badge>
      ),
    },
    {
      key: "actor_name",
      label: "المستخدم المنفذ",
      className: "w-48",
      render: (r) => (
        <p className="font-bold text-slate-900 dark:text-white text-body-sm">
          {r.actor_name || "النظام الإداري"}
        </p>
      ),
    },
    {
      key: "target",
      label: "المكون / المستهدف",
      className: "w-44",
      render: (r) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-800 dark:text-slate-200 text-caption">
            {formatTargetText(r.target_model, r.metadata)}
          </p>
          {r.target_id && (
            <p className="font-mono text-caption text-slate-400">
              #{r.target_id}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "description",
      label: "التفاصيل والبيان",
      render: (r) => (
        <span className="font-medium text-slate-800 dark:text-slate-200 text-body-sm line-clamp-1" title={r.description}>
          {r.description || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "عرض",
      className: "text-center w-16",
      render: (r) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord(r);
          }}
          className="h-7.5 w-7.5 p-0 rounded-lg text-slate-500 hover:text-[#2B95E8]"
          title="عرض التفاصيل الكاملة"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header & Actions */}
      <PageHeader
        title="سجل التدقيق الأمني والنشاطات"
        description="سجل العمليات الإدارية والأمنية: تسجيل التمام، العهدة والجرد، تحميل الوثائق، وإصدار أوامر التحرك."
      >
        <Button
          variant="outline"
          onClick={handleExportCsv}
          className="gap-2 rounded-2xl font-bold border-slate-200/80 dark:border-white/10"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>تصدير السجل الأمني (Excel / CSV)</span>
        </Button>
      </PageHeader>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي العمليات المسجلة"
          value={statsData?.total ?? totalCount}
          subtitle="كافة الأحداث الإدارية والأمنية"
          icon={Shield}
          variant="navy"
        />
        <StatCard
          title="عمليات العهدة والجرد"
          value={statsData?.custody_inventory ?? 0}
          subtitle="تسليم واسترجاع العتاد والسلاح"
          icon={Package}
          variant="default"
          tone="success"
        />
        <StatCard
          title="الطباعة والمستندات"
          value={statsData?.documents_print ?? 0}
          subtitle="تصدير كشوفات وتحميل وثائق"
          icon={Printer}
          variant="default"
          tone="blue"
        />
        <StatCard
          title="تنبيهات الدخول والأمان"
          value={statsData?.security_alerts ?? 0}
          subtitle="محاولات دخول غير مصرحة"
          icon={Lock}
          variant="default"
          tone={statsData?.security_alerts > 0 ? "danger" : "neutral"}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="ابحث بالبيان، اسم المستخدم، أو رقم المستهدف..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pr-10 rounded-2xl h-11 text-body-sm"
            />
          </div>

          {/* Action Filter */}
          <div className="md:col-span-3">
            <Select
              value={action}
              onValueChange={(val) => {
                setAction(val);
                setPage(1);
              }}
              options={ACTION_OPTIONS}
            />
          </div>

          {/* Target Section Filter */}
          <div className="md:col-span-3">
            <Select
              value={targetModel}
              onValueChange={(val) => {
                setTargetModel(val);
                setPage(1);
              }}
              options={TARGET_MODELS}
            />
          </div>

          {/* Reset Button */}
          <div className="md:col-span-1 flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="w-full h-11 rounded-2xl text-slate-500 dark:text-gray-400 p-0"
              title="إعادة ضبط الفلاتر"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main DataTable (Zero IP column for general viewers) */}
      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedRecord(row)}
        emptyMessage="لا توجد سجلات تدقيق مسجلة تطابق خيارات البحث الحالية."
      />

      {/* Pagination */}
      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Record Details Modal */}
      <Dialog open={Boolean(selectedRecord)} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl p-0 rounded-[28px] border border-slate-200/80 dark:border-white/10 overflow-hidden bg-white dark:bg-[#1A2038]">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
            <div className="space-y-1 text-start">
              <DialogTitle className="text-title font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#2B95E8]" />
                <span>تفاصيل سجل التدقيق والنشاط الإداري</span>
              </DialogTitle>
              <DialogDescription className="text-caption text-slate-500 dark:text-gray-400">
                توثيق كامل لكافة معطيات العملية، هوية المستخدم المنفذ، والمكون المستهدف
              </DialogDescription>
            </div>
          </DialogHeader>

          {selectedRecord && (
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Header Status Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 text-start">
                <div className="space-y-1">
                  <span className="text-caption text-slate-500 dark:text-gray-400 font-bold">نوع الإجراء المنفذ</span>
                  <div>
                    <Badge variant={ACTION_VARIANTS[selectedRecord.action] || "outline"} className="font-bold text-body-sm">
                      {formatActionText(selectedRecord.action)}
                    </Badge>
                  </div>
                </div>
                <div className="text-end space-y-1">
                  <span className="text-caption text-slate-500 dark:text-gray-400 font-bold">معرّف السجل</span>
                  <p className="font-mono text-caption font-bold text-slate-900 dark:text-white" dir="ltr">
                    #{selectedRecord.id}
                  </p>
                </div>
              </div>

              {/* General Detail Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption text-start">
                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 font-bold">
                    <User className="h-4 w-4 text-[#2B95E8]" />
                    <span>المستخدم المنفذ</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white text-body-sm">
                    {selectedRecord.actor_name || selectedRecord.actor_username || "النظام"}
                  </p>
                  {selectedRecord.actor_username && (
                    <p className="font-mono text-[#2B95E8] text-caption" dir="ltr">
                      @{selectedRecord.actor_username}
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 font-bold">
                    <Clock className="h-4 w-4 text-[#2B95E8]" />
                    <span>التوقيت والتاريخ الدقيق</span>
                  </div>
                  <p className="font-mono font-bold text-slate-900 dark:text-white text-body-sm" dir="ltr">
                    {formatDateTime(selectedRecord.created_at)}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Laptop className="h-4 w-4 text-[#2B95E8]" />
                      <span>القسم والمستهدف</span>
                    </div>
                    {selectedRecord.target_id && (
                      <span className="font-mono text-micro bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-slate-600 dark:text-gray-300">
                        معرف: #{selectedRecord.target_id}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white text-body-sm pt-0.5">
                    {formatTargetText(selectedRecord.target_model, selectedRecord.metadata)}
                  </p>
                  {selectedRecord.metadata?.serial_number && (
                    <span className="inline-block mt-1 font-mono font-bold text-caption bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-md" dir="ltr">
                      رقم تسلسلي: {selectedRecord.metadata.serial_number}
                    </span>
                  )}
                </div>
              </div>

              {/* Description Block */}
              <div className="space-y-1.5 text-start">
                <div className="flex items-center gap-1.5 text-caption font-bold text-slate-600 dark:text-gray-400">
                  <FileText className="h-4 w-4 text-[#2B95E8]" />
                  <span>البيان والتفاصيل الإدارية</span>
                </div>
                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 font-medium text-body-sm text-slate-900 dark:text-white leading-relaxed">
                  {selectedRecord.description || "لا يوجد بيان إضافي مسجل."}
                </div>
              </div>

              {/* SuperAdmin ONLY Security & Geolocation Section */}
              {isSuperUser && selectedRecord.ip_address && (
                <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 space-y-3 text-start">
                  <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-caption">
                      <Globe className="h-4 w-4 text-[#2B95E8]" />
                      <span>معلومات الشبكة والموقع الجغرافي (حصري للإدارة العليا - SuperAdmin)</span>
                    </div>
                    <span className="text-micro font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      سري ومشفّر
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption">
                    <div className="space-y-1">
                      <span className="text-slate-500 dark:text-gray-400 font-bold">عنوان الشبكة (IP Address):</span>
                      <p className="font-mono font-bold text-slate-900 dark:text-white text-body-sm" dir="ltr">
                        {selectedRecord.ip_address}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-500 dark:text-gray-400 font-bold">طبيعة الاتصال:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {isPrivateOrLocalIp(selectedRecord.ip_address) ? (
                          <span className="text-emerald-700 dark:text-emerald-400">شبكة المنظومة الداخلية / خادم محلي</span>
                        ) : (
                          <span className="text-[#2B95E8]">عنوان شبكة خارجي (Public IP)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Geolocation & Map Link */}
                  <div className="pt-2 border-t border-blue-500/15 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-caption font-medium">
                      <MapPin className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>
                        {isPrivateOrLocalIp(selectedRecord.ip_address)
                          ? "تم التسجيل من الخادم المركزي المحلي المباشر للجهاز الوطني للقوى المساندة."
                          : `الموقع الجغرافي للشبكة المرتبطة بالعنوان ${selectedRecord.ip_address}`}
                      </span>
                    </div>

                    {!isPrivateOrLocalIp(selectedRecord.ip_address) && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedRecord.ip_address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-caption transition-all shadow-xs"
                      >
                        <span>تحديد الموقع على الخريطة</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  {/* User Agent */}
                  {selectedRecord.user_agent && (
                    <div className="space-y-1 pt-1">
                      <span className="text-caption font-bold text-slate-500 dark:text-gray-400">معرف المتصفح والجهاز (User Agent):</span>
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 font-mono text-caption text-slate-600 dark:text-gray-300 break-all dir-ltr" dir="ltr">
                        {selectedRecord.user_agent}
                      </div>
                    </div>
                  )}

                  {/* Raw Metadata JSON for SuperAdmin */}
                  {selectedRecord.metadata && Object.keys(selectedRecord.metadata).length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-caption font-bold text-slate-500 dark:text-gray-400">وسوم النظام البرمجية (System Metadata JSON):</span>
                      <pre className="p-3 rounded-2xl bg-slate-900 text-slate-100 font-mono text-caption overflow-x-auto dir-ltr max-h-36" dir="ltr">
                        {JSON.stringify(selectedRecord.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-end -mx-6 -mb-6">
                <Button variant="outline" onClick={() => setSelectedRecord(null)} className="rounded-xl">
                  إغلاق النافذة
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AuditPage;
