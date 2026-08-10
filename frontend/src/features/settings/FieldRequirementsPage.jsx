import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Switch } from "../../components/ui/Switch";
import { useFieldRequirements, useUpdateFieldRequirement } from "./api";

export function FieldRequirementsPage() {
  const { data: requirements = [], isLoading } = useFieldRequirements();
  const updateRequirement = useUpdateFieldRequirement();

  const columns = [
    {
      key: "label_ar",
      label: "اسم الحقل",
      render: (row) => <span className="font-medium">{row.label_ar}</span>,
    },
    {
      key: "type",
      label: "نوع الحقل",
      render: (row) => {
        const types = {
          text: "نص",
          image: "صورة",
          date: "تاريخ",
          select: "قائمة اختيار",
          textarea: "نص طويل",
          file: "ملف",
        };
        return <span className="text-muted-foreground">{types[row.type] || row.type}</span>;
      },
    },
    {
      key: "is_required",
      label: "حقل مطلوب",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.is_required}
            disabled={!row.lockable || updateRequirement.isPending}
            onCheckedChange={(checked) =>
              updateRequirement.mutate({ id: row.id, is_required: checked })
            }
          />
          {!row.lockable && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              أساسي (إجباري)
            </span>
          )}
        </div>
      ),
    },
    {
      key: "is_visible",
      label: "ظاهر في الاستمارة",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.is_visible}
            disabled={!row.lockable || updateRequirement.isPending}
            onCheckedChange={(checked) =>
              updateRequirement.mutate({ id: row.id, is_visible: checked })
            }
          />
          {!row.lockable && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              أساسي (مرئي دائماً)
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">إعدادات الحقول</h1>
          <p className="text-sm text-muted-foreground">
            تخصيص متطلبات إدخال البيانات ورؤيتها لاستمارة إضافة وتعديل الأعضاء.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>متطلبات الحقول</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={requirements}
            isLoading={isLoading}
            emptyMessage="لا توجد حقول مسجلة في النظام"
          />
        </CardContent>
      </Card>
    </div>
  );
}
