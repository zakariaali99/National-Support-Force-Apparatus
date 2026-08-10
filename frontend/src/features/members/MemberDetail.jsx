import { Pencil, Trash2, Shield, Calendar, Phone, CreditCard, Droplets, MapPin, FileText } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AuthedImage } from "../../components/ui/AuthedImage";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatDate } from "../../lib/format";
import { useAuth } from "../auth/AuthContext";
import { HistoryDialog } from "../audit/HistoryDialog";
import { useDeleteMember, useMember } from "./api";
import { approvalStatusLabel, serviceStatusLabel } from "./constants";
import { DocumentUpload } from "./DocumentUpload";
import { PrintDialog } from "./PrintDialog";
import { ProfileExtras } from "./ProfileExtras";

function DetailItem({ icon: Icon, label, value, dir }) {
  return (
    <div className="flex items-center gap-3.5 p-3 rounded-xl border border-border/40 bg-card/45 hover:bg-secondary/20 transition-all">
      <div className="p-2.5 bg-primary/5 text-primary rounded-lg">
        <Icon className="h-4.5 w-4.5 shrink-0" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-xs font-bold text-foreground mt-0.5" dir={dir}>
          {value || "—"}
        </p>
      </div>
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
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }
  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-2xl bg-card space-y-2.5">
        <Shield className="h-12 w-12 text-destructive/40" />
        <h3 className="font-bold text-base">لم يتم العثور على العضو</h3>
        <p className="text-xs text-muted-foreground">الملف غير متوفر أو قد يكون تم حذفه من النظام.</p>
        <Button onClick={() => navigate("/members")}>العودة لسجل الأعضاء</Button>
      </div>
    );
  }

  async function handleDelete() {
    if (window.confirm(`هل تريد حذف العضو "${member.full_name}"؟`)) {
      await deleteMember.mutateAsync(member.id);
      navigate("/members");
    }
  }

  function getServiceStatusVariant(status) {
    switch (status) {
      case "active": return "success";
      case "suspended": return "destructive";
      case "on_leave": return "warning";
      case "retired": return "secondary";
      default: return "outline";
    }
  }

  function getApprovalStatusVariant(status) {
    switch (status) {
      case "approved": return "success";
      case "rejected": return "destructive";
      case "pending": return "warning";
      default: return "secondary";
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Hero Header Banner */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 shadow-sm flex flex-col gap-6 sm:flex-row sm:items-center justify-between relative overflow-hidden bg-gradient-to-r from-secondary/20 via-transparent to-transparent animate-fade-in">
        <div className="flex items-center gap-4.5 relative z-10">
          <AuthedImage
            src={member.photo_url}
            alt={member.full_name}
            className="h-20 w-20 rounded-full border-2 border-border shadow-md object-cover shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight line-clamp-1">
              {member.full_name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge variant={getServiceStatusVariant(member.service_status)} pulse={member.service_status === "active"}>
                {serviceStatusLabel(member.service_status)}
              </Badge>
              <Badge variant={getApprovalStatusVariant(member.approval_status)}>
                {approvalStatusLabel(member.approval_status)}
              </Badge>
              <span className="text-xs text-muted-foreground font-semibold px-1">•</span>
              <span className="text-xs font-bold text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded">
                {member.rank_name ?? member.rank}
              </span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 relative z-10 sm:self-center">
          {hasPermission("member.print") && <PrintDialog member={member} />}
          {hasPermission("audit.view") && <HistoryDialog model="member" id={member.id} />}
          {hasPermission("member.edit") && (
            <Button asChild variant="outline" size="sm" className="shadow-sm">
              <Link to={`/members/${member.id}/edit`} className="flex items-center gap-1.5">
                <Pencil className="h-4 w-4 shrink-0" />
                <span>تعديل</span>
              </Link>
            </Button>
          )}
          {hasPermission("member.delete") && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive shadow-sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span>حذف</span>
            </Button>
          )}
        </div>
        <div className="absolute top-0 end-0 h-32 w-32 bg-primary/5 rounded-full blur-2xl -translate-y-6 translate-x-6" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Core Military and Personal Info List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-bold">البيانات العسكرية والشخصية</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem icon={Shield} label="الرقم الحربي" value={member.force_number} dir="ltr" />
                <DetailItem icon={CreditCard} label="الرقم الوطني" value={member.national_number} dir="ltr" />
                <DetailItem icon={Calendar} label="تاريخ الميلاد" value={formatDate(member.date_of_birth)} />
                <DetailItem icon={MapPin} label="مكان الميلاد" value={member.place_of_birth} />
                <DetailItem icon={Droplets} label="فصيلة الدم" value={member.blood_type} />
                <DetailItem icon={Phone} label="رقم الهاتف" value={member.phone} dir="ltr" />
                <DetailItem icon={Calendar} label="تاريخ الالتحاق" value={formatDate(member.join_date)} />
                <DetailItem icon={Shield} label="الفصيل (الإدارة)" value={member.faction_name ?? member.faction} />
              </div>
            </CardContent>
          </Card>

          {/* Pledges / Commitments */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-bold">التعهدات والالتزامات</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-3.5 p-4 rounded-xl border border-border/50 bg-secondary/10">
                <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed flex-1">
                  {member.pledges || "لا توجد تعهدات مسجلة على ذمة العضو."}
                </p>
              </div>
            </CardContent>
          </Card>

          <ProfileExtras member={member} />
        </div>

        {/* Documents Attachment widgets card */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-bold">المستندات والوثائق المرفقة</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <DocumentUpload memberId={member.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
