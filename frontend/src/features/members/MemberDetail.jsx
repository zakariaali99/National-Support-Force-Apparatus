import { Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AuthedImage } from "../../components/ui/AuthedImage";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { formatDate } from "../../lib/format";
import { useAuth } from "../auth/AuthContext";
import { useDeleteMember, useMember } from "./api";
import { approvalStatusLabel, serviceStatusLabel } from "./constants";
import { DocumentUpload } from "./DocumentUpload";

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

export function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { data: member, isLoading } = useMember(id);
  const deleteMember = useDeleteMember();

  if (isLoading) {
    return <p className="p-8 text-center text-sm text-muted-foreground">جارِ التحميل...</p>;
  }
  if (!member) {
    return <p className="p-8 text-center text-sm text-muted-foreground">لم يتم العثور على العضو</p>;
  }

  async function handleDelete() {
    if (window.confirm(`هل تريد حذف العضو "${member.full_name}"؟`)) {
      await deleteMember.mutateAsync(member.id);
      navigate("/members");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-4">
            <AuthedImage src={member.photo_url} alt={member.full_name} className="h-16 w-16 rounded-full" />
            <div>
              <CardTitle>{member.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {serviceStatusLabel(member.service_status)} · {approvalStatusLabel(member.approval_status)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasPermission("member.edit") && (
              <Button asChild variant="outline" size="sm">
                <Link to={`/members/${member.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  تعديل
                </Link>
              </Button>
            )}
            {hasPermission("member.delete") && (
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>البيانات الأساسية</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="الرقم الحربي" value={member.force_number} />
            <InfoRow label="الرقم الوطني" value={member.national_number} />
            <InfoRow label="الرتبة" value={member.rank_name ?? member.rank} />
            <InfoRow label="الفصيل" value={member.faction_name ?? member.faction} />
            <InfoRow label="تاريخ الميلاد" value={formatDate(member.date_of_birth)} />
            <InfoRow label="مكان الميلاد" value={member.place_of_birth} />
            <InfoRow label="فصيلة الدم" value={member.blood_type} />
            <InfoRow label="رقم الهاتف" value={member.phone} />
            <InfoRow label="تاريخ الالتحاق" value={formatDate(member.join_date)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>التعهدات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{member.pledges || "لا يوجد"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المستندات</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUpload memberId={member.id} />
        </CardContent>
      </Card>
    </div>
  );
}
