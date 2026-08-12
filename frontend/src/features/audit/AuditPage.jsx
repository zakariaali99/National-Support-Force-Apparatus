import { useState } from "react";
import { Eye, Shield, User, Clock, Globe, Laptop, FileText, Info } from "lucide-react";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { DataTable } from "../../components/ui/DataTable";
import { PageHeader } from "../../components/ui/PageHeader";
import { FilterBar } from "../../components/ui/FilterBar";
import { Pagination } from "../../components/ui/Pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/Dialog";
import { formatDate, formatDateTime, formatTime } from "../../lib/format";
import { useActivityLog } from "./api";

const ACTION_LABELS = {
  document_download: "تحميل مستند",
  print: "طباعة",
  export: "تصدير",
  login_failed: "محاولة دخول فاشلة",
  backup_run: "تشغيل نسخة احتياطية",
  backup_download: "تحميل نسخة احتياطية",
  inventory_create: "تسجيل عتاد/سلاح بالجرد",
  inventory_custody_assign: "تسليم عهدة فردية",
  inventory_custody_release: "إرجاع عهدة للمخزن",
};

const ACTION_VARIANTS = {
  login_failed: "destructive",
  document_download: "info",
  print: "secondary",
  export: "secondary",
  backup_run: "success",
  backup_download: "warning",
  inventory_create: "success",
  inventory_custody_assign: "info",
  inventory_custody_release: "warning",
};

export function AuditPage() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const { data, isLoading } = useActivityLog({
    action: action || undefined,
    page,
    page_size: pageSize,
  });
  const rows = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns = [
    {
      key: "date",
      label: "التاريخ والوقت",
      render: (r) => (
        <div className="space-y-0.5">
          <p className="font-mono text-body-sm font-bold text-foreground" dir="ltr">
            {formatDate(r.created_at)}
          </p>
          <p className="font-mono text-caption text-muted-foreground" dir="ltr">
            {formatTime(r.created_at)}
          </p>
        </div>
      ),
    },
    {
      key: "action",
      label: "نوع الإجراء",
      render: (r) => (
        <Badge variant={ACTION_VARIANTS[r.action] || "outline"} className="font-bold">
          {ACTION_LABELS[r.action] || r.action}
        </Badge>
      ),
    },
    {
      key: "actor_name",
      label: "المستخدم المنفذ",
      render: (r) => (
        <div className="space-y-0.5">
          <p className="font-bold text-foreground">{r.actor_name || r.actor_username || "النظام"}</p>
          {r.actor_username && (
            <p className="text-caption font-mono text-muted-foreground" dir="ltr">
              @{r.actor_username}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "description",
      label: "التفاصيل والبيان",
      render: (r) => <span className="font-medium text-foreground line-clamp-2">{r.description || "—"}</span>,
    },
    {
      key: "ip_address",
      label: "عنوان IP",
      render: (r) => (
        <span className="font-mono text-caption bg-muted/60 text-foreground px-2 py-0.5 rounded dir-ltr inline-block" dir="ltr">
          {r.ip_address || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "عرض",
      className: "text-center w-20",
      render: (r) => (
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord(r);
          }}
          title="عرض التفاصيل الكاملة"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="سجل التدقيق الأمني والنشاطات"
        description="سجل الإجراءات والعمليات الحساسة: الجرد والعتاد، تحميل المستندات، والنسخ الاحتياطية."
      />

      <FilterBar hideSearch>
        <div className="max-w-xs">
          <Select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">كل الإجراءات والأعمال</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedRecord(row)}
        emptyMessage="لا توجد سجلات تدقيق مسجلة"
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Record Details Modal */}
      <Dialog open={Boolean(selectedRecord)} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-body font-bold">
              <Shield className="h-5 w-5 text-primary" />
              <span>تفاصيل سجل التدقيق الأمني</span>
            </DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 pt-2">
              {/* Header Status Card */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-caption text-muted-foreground font-bold">نوع الإجراء المنفذ</span>
                  <div>
                    <Badge variant={ACTION_VARIANTS[selectedRecord.action] || "outline"} className="font-bold text-body-sm">
                      {ACTION_LABELS[selectedRecord.action] || selectedRecord.action}
                    </Badge>
                  </div>
                </div>
                <div className="text-end space-y-1">
                  <span className="text-caption text-muted-foreground font-bold">معرّف السجل</span>
                  <p className="font-mono text-caption font-bold text-foreground" dir="ltr">
                    #{selectedRecord.id}
                  </p>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption">
                <div className="p-3 rounded-xl border border-border/60 bg-card space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-bold">
                    <User className="h-4 w-4 text-primary" />
                    <span>المستخدم المنفذ</span>
                  </div>
                  <p className="font-extrabold text-foreground text-body-sm">
                    {selectedRecord.actor_name || selectedRecord.actor_username || "النظام"}
                  </p>
                  {selectedRecord.actor_username && (
                    <p className="font-mono text-muted-foreground" dir="ltr">
                      @{selectedRecord.actor_username}
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-card space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-bold">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>التاريخ والوقت Exact</span>
                  </div>
                  <p className="font-mono font-bold text-foreground text-body-sm" dir="ltr">
                    {formatDateTime(selectedRecord.created_at)}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-card space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-bold">
                    <Globe className="h-4 w-4 text-primary" />
                    <span>عنوان الشبكة IP</span>
                  </div>
                  <p className="font-mono font-bold text-foreground text-body-sm" dir="ltr">
                    {selectedRecord.ip_address || "—"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between text-muted-foreground font-bold">
                    <div className="flex items-center gap-1.5">
                      <Laptop className="h-4 w-4 text-primary" />
                      <span>المكون / المستهدف</span>
                    </div>
                    {selectedRecord.target_model && (
                      <span className="font-mono text-micro text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {selectedRecord.target_model} #{selectedRecord.target_id}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center flex-wrap gap-2 pt-0.5">
                    <span className="font-extrabold text-foreground text-body-sm">
                      {selectedRecord.metadata?.item_name ||
                        selectedRecord.metadata?.target_name ||
                        (selectedRecord.target_model
                          ? `${selectedRecord.target_model} (#${selectedRecord.target_id || "—"})`
                          : "—")}
                    </span>

                    {selectedRecord.metadata?.serial_number && (
                      <span className="font-mono font-bold text-caption bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-md dir-ltr" dir="ltr">
                        رقم تسلسلي: {selectedRecord.metadata.serial_number}
                      </span>
                    )}

                    {selectedRecord.metadata?.assigned_member && (
                      <span className="font-bold text-caption bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-md">
                        مستلم العهدة: {selectedRecord.metadata.assigned_member}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description Block */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-caption font-bold text-muted-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>الوصف والبيان التفصيلي</span>
                </div>
                <div className="p-3.5 rounded-xl border border-border/80 bg-card font-medium text-body-sm text-foreground leading-relaxed">
                  {selectedRecord.description || "لا يوجد بيان إضافي مسجل."}
                </div>
              </div>

              {/* User Agent Block */}
              {selectedRecord.user_agent && (
                <div className="space-y-1">
                  <span className="text-caption font-bold text-muted-foreground">معرف المتصفح والجهاز (User Agent)</span>
                  <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60 font-mono text-micro text-muted-foreground break-all dir-ltr" dir="ltr">
                    {selectedRecord.user_agent}
                  </div>
                </div>
              )}

              {/* Metadata JSON Block if exists */}
              {selectedRecord.metadata && Object.keys(selectedRecord.metadata).length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-caption font-bold text-muted-foreground">
                    <Info className="h-4 w-4 text-primary" />
                    <span>بيانات وسوم النظام الإضافية (Metadata)</span>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto dir-ltr max-h-40" dir="ltr">
                    {JSON.stringify(selectedRecord.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-border/60">
                <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                  إغلاق النافذة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
