import { Link } from "react-router-dom";
import { Check, X, ArrowUpRight, ClipboardList } from "lucide-react";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { showToast } from "../../components/ui/Toast";
import { useAuth } from "../auth/AuthContext";
import { useApproveMember, useMembers, useRejectMember } from "./api";

export function ApprovalQueue() {
  const { user } = useAuth();
  const { data, isLoading } = useMembers({ approval_status: "pending", page_size: 50 });
  const approveMember = useApproveMember();
  const rejectMember = useRejectMember();
  const members = data?.results ?? [];

  async function handleApprove(member) {
    try {
      await approveMember.mutateAsync({ id: member.id });
      showToast("تم اعتماد الملف");
    } catch (err) {
      showToast(err?.response?.data?.detail || "تعذر اعتماد الملف", "error");
    }
  }

  async function handleReject(member) {
    const reason = window.prompt("سبب الرفض (اختياري):") || "";
    try {
      await rejectMember.mutateAsync({ id: member.id, reason });
      showToast("تم رفض الملف");
    } catch (err) {
      showToast(err?.response?.data?.detail || "تعذر رفض الملف", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">طلبات الاعتماد</h1>
        <p className="text-sm text-muted-foreground">ملفات الأعضاء بانتظار المراجعة والاعتماد.</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      )}

      {!isLoading && members.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-2xl bg-card space-y-2.5">
          <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="font-bold text-base">لا توجد طلبات بانتظار الاعتماد</h3>
        </div>
      )}

      <div className="space-y-3">
        {members.map((member) => {
          const isOwnSubmission = user && member.created_by === user.id;
          return (
            <Card key={member.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/members/${member.id}`} className="font-bold text-sm text-foreground hover:text-primary flex items-center gap-1">
                      {member.full_name}
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                    <Badge variant="warning">بانتظار الاعتماد</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {member.rank_name} — {member.faction_name} — <bdi dir="ltr">{member.force_number}</bdi>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isOwnSubmission ? (
                    <span className="text-[10px] text-muted-foreground">لا يمكنك اعتماد ملف أنشأته</span>
                  ) : (
                    <>
                      <Button size="sm" className="bg-success text-white hover:opacity-90" onClick={() => handleApprove(member)}>
                        <Check className="h-4 w-4" />
                        اعتماد
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleReject(member)}>
                        <X className="h-4 w-4" />
                        رفض
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
