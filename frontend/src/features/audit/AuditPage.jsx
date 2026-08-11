import { useState } from "react";

import { Badge } from "../../components/ui/Badge";
import { Card, CardContent } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import { formatDateTime } from "../../lib/format";
import { useActivityLog } from "./api";

const ACTION_LABELS = {
  document_download: "تحميل مستند",
  print: "طباعة",
  export: "تصدير",
  login_failed: "محاولة دخول فاشلة",
  backup_run: "تشغيل نسخة احتياطية",
  backup_download: "تحميل نسخة احتياطية",
};

const ACTION_VARIANTS = {
  login_failed: "destructive",
  document_download: "info",
  print: "secondary",
  export: "secondary",
  backup_run: "success",
  backup_download: "warning",
};

export function AuditPage() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useActivityLog({
    action: action || undefined,
    page,
    page_size: pageSize,
  });
  const rows = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns = [
    { key: "created_at", label: "التاريخ والوقت", render: (r) => <bdi dir="ltr" className="font-mono text-xs">{formatDateTime(r.created_at)}</bdi> },
    {
      key: "action",
      label: "نوع الإجراء",
      render: (r) => <Badge variant={ACTION_VARIANTS[r.action] || "outline"}>{ACTION_LABELS[r.action] || r.action}</Badge>,
    },
    { key: "actor_username", label: "المستخدم المنفذ", render: (r) => <span className="font-bold">{r.actor_username || "—"}</span> },
    { key: "description", label: "التفاصيل والبيان" },
    { key: "ip_address", label: "عنوان IP", render: (r) => <bdi dir="ltr" className="font-mono text-xs">{r.ip_address || "—"}</bdi> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">سجل التدقيق الأمني والنشاطات</h1>
        <p className="text-xs text-muted-foreground font-medium mt-1">سجل الإجراءات الحساسة: تحميل المستندات، الطباعة، التصدير، ومحاولات الدخول.</p>
      </div>

      <Card className="rounded-2xl border border-border/80 shadow-sm">
        <CardContent className="p-4">
          <div className="max-w-xs">
            <Select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
              <option value="">كل الإجراءات والأعمال</option>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} rows={rows} isLoading={isLoading} emptyMessage="لا توجد سجلات تدقيق مسجلة" />

      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
