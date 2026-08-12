import { useState } from "react";
import { Briefcase, FileText, FolderOpen, Pencil, Shield, Trash2, UserRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/AlertDialog";
import { AuthedImage } from "../../components/ui/AuthedImage";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DetailGrid, DetailItem } from "../../components/ui/DetailGrid";
import { Skeleton } from "../../components/ui/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/Tabs";
import { formatDate } from "../../lib/format";
import { useAuth } from "../auth/AuthContext";
import { HistoryDialog } from "../audit/HistoryDialog";
import { useDeleteMember, useMember } from "./api";
import { approvalStatusLabel, serviceStatusLabel } from "./constants";
import { DocumentUpload } from "./DocumentUpload";
import { MemberPledgesTab } from "./MemberPledgesTab";
import { PrintDialog } from "./PrintDialog";
import { ProfileExtras } from "./ProfileExtras";
import { LocationMapPicker } from "../../components/ui/LocationMapPicker";

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

export function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { data: member, isLoading } = useMember(id);
  const deleteMember = useDeleteMember();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-card border border-border bg-surface p-6 flex flex-col sm:flex-row items-center gap-4 shadow-raised">
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
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-card bg-surface space-y-2.5">
        <Shield className="h-12 w-12 text-destructive/40" />
        <h3 className="font-bold text-body">لم يتم العثور على الفرد</h3>
        <p className="text-body-sm text-muted-foreground">الملف غير متوفر أو قد يكون تم حذفه من النظام.</p>
        <Button onClick={() => navigate("/members")}>العودة لسجل الأفراد</Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Sticky identity header */}
        <div className="sticky top-16 z-20 -mx-4 border-b border-border bg-surface px-4 py-4 shadow-sm md:rounded-card md:border md:-mx-0 md:shadow-raised">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <AuthedImage
                src={member.photo_url}
                alt={member.full_name}
                className="h-16 w-16 shrink-0 rounded-full border-2 border-border object-cover shadow-md"
              />
              <div className="min-w-0">
                <h1 className="line-clamp-1 text-title font-bold tracking-tight text-foreground">
                  {member.full_name}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge variant={getServiceStatusVariant(member.service_status)} pulse={member.service_status === "active"}>
                    {serviceStatusLabel(member.service_status)}
                  </Badge>
                  <Badge variant={getApprovalStatusVariant(member.approval_status)}>
                    {approvalStatusLabel(member.approval_status)}
                  </Badge>
                  {member.rank_name && (
                    <span className="rounded-control border border-primary/15 bg-primary/5 px-2 py-0.5 text-caption font-bold text-primary">
                      {member.rank_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {hasPermission("member.print") && <PrintDialog member={member} />}
              {hasPermission("audit.view") && <HistoryDialog model="member" id={member.id} />}
              {hasPermission("member.edit") && (
                <Button asChild variant="outline" size="sm">
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
                  className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  <span>حذف</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">
              <UserRound className="h-4 w-4 me-1.5" aria-hidden="true" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FolderOpen className="h-4 w-4 me-1.5" aria-hidden="true" />
              المستندات
            </TabsTrigger>
            <TabsTrigger value="career">
              <Briefcase className="h-4 w-4 me-1.5" aria-hidden="true" />
              السجل الوظيفي
            </TabsTrigger>
            <TabsTrigger value="pledges">
              <FileText className="h-4 w-4 me-1.5" aria-hidden="true" />
              التعهدات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="rounded-card border border-border bg-surface text-fg shadow-raised">
              <div className="border-b border-border/60 p-4">
                <p className="text-section font-bold text-foreground">البيانات العسكرية والشخصية</p>
              </div>
              <div className="p-4">
                <DetailGrid className="sm:grid-cols-2 lg:grid-cols-2">
                  <DetailItem icon={Shield} label="الرقم الحربي" value={member.force_number} dir="ltr" />
                  <DetailItem icon={Shield} label="الرقم الوطني" value={member.national_number} dir="ltr" />
                  <DetailItem icon={Shield} label="رقم الهوية شخصية" value={member.id_card_number} dir="ltr" />
                  <DetailItem icon={Shield} label="رقم جواز السفر" value={member.passport_number} dir="ltr" />
                  <DetailItem icon={Shield} label="اسم الأم" value={member.mother_name} />
                  <DetailItem icon={Shield} label="تاريخ الميلاد" value={formatDate(member.date_of_birth)} />
                  <DetailItem icon={Shield} label="مكان الميلاد" value={member.place_of_birth} />
                  <DetailItem icon={Shield} label="فصيلة الدم" value={member.blood_type} />
                  <DetailItem icon={Shield} label="رقم الهاتف" value={member.phone} dir="ltr" />
                  <DetailItem icon={Shield} label="تاريخ الالتحاق" value={formatDate(member.join_date)} />
                  <DetailItem icon={Shield} label="الإدارة التابع لها" value={member.faction_name ?? member.faction} />
                  <DetailItem icon={Shield} label="السكن الحالي" value={member.current_residence} />
                  <DetailItem icon={Shield} label="أقرب نقطة دالة" value={member.nearest_landmark} />
                </DetailGrid>
              </div>
              {member.location_url && (
                <div className="p-4 border-t border-border/60">
                  <LocationMapPicker locationUrl={member.location_url} readOnly />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <DocumentUpload memberId={member.id} />
          </TabsContent>

          <TabsContent value="career">
            <ProfileExtras member={member} />
          </TabsContent>

          <TabsContent value="pledges">
            <MemberPledgesTab memberId={member.id} member={member} />
          </TabsContent>
        </Tabs>

        {/* Delete Modal */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف الفرد</AlertDialogTitle>
              <AlertDialogDescription>
                هل تريد حذف الفرد "{member.full_name}"؟ هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="outline">إلغاء</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  variant="destructive"
                  disabled={deleteMember.isPending}
                  onClick={async () => {
                    await deleteMember.mutateAsync(member.id);
                    navigate("/members");
                  }}
                >
                  حذف نهائي
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}