import { useState } from "react";

import { Badge } from "../../components/ui/Badge";
import { Card, CardContent } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { DataTable } from "../../components/ui/DataTable";
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
  const { data, isLoading } = useActivityLog({ action: action || undefined, page_size: 50 });
  const rows = data?.results ?? [];

  const columns = [
    { key: "created_at", label: "التاريخ", render: (r) => <bdi dir="ltr">{formatDateTime(r.created_at)}</bdi> },
    {
      key: "action",
      label: "الإجراء",
      render: (r) => <Badge variant={ACTION_VARIANTS[r.action] || "outline"}>{ACTION_LABELS[r.action] || r.action}</Badge>,
    },
    { key: "actor_username", label: "المستخدم", render: (r) => r.actor_username || "—" },
    { key: "description", label: "التفاصيل" },
    { key: "ip_address", label: "عنوان IP", render: (r) => <bdi dir="ltr">{r.ip_address || "—"}</bdi> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">سجل التدقيق</h1>
        <p className="text-sm text-muted-foreground">سجل الإجراءات الحساسة: تحميل المستندات، الطباعة، التصدير، محاولات الدخول الفاشلة.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="max-w-xs">
            <Select value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="">كل الإجراءات</option>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} rows={rows} isLoading={isLoading} emptyMessage="لا توجد سجلات" />
    </div>
  );
}
