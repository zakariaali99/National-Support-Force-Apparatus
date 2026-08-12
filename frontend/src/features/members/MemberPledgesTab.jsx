import { useState } from "react";
import { Download, Eye, FileText, Plus, Trash2, Upload } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/AlertDialog";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/Dialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Textarea } from "../../components/ui/Textarea";
import { showToast } from "../../components/ui/Toast";
import { formatDate } from "../../lib/format";
import { useAuth } from "../auth/AuthContext";
import {
  fetchAuthedBlobUrl,
  useCreateMemberPledge,
  useDeleteMemberPledge,
  useMemberPledges,
} from "./api";

export function MemberPledgesTab({ memberId, member }) {
  const targetMemberId = memberId ?? member?.id;
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("member.edit");

  const { data: pledges = [], isLoading } = useMemberPledges(targetMemberId);
  const createPledge = useCreateMemberPledge();
  const deletePledge = useDeleteMemberPledge(targetMemberId);

  const [addOpen, setAddOpen] = useState(false);
  const [pledgeToDelete, setPledgeToDelete] = useState(null);
  const [previewPledge, setPreviewPledge] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    issue_date: "",
    attachment: null,
  });

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim() || !targetMemberId) return;

    try {
      await createPledge.mutateAsync({
        member: targetMemberId,
        title: form.title,
        description: form.description,
        issue_date: form.issue_date || null,
        attachment: form.attachment,
      });
      setForm({ title: "", description: "", issue_date: "", attachment: null });
      setAddOpen(false);
      showToast("تمت إضافة التعهد بنجاح");
    } catch {
      showToast("تعذرت إضافة التعهد", "error");
    }
  }

  async function handleDelete() {
    if (!pledgeToDelete) return;
    try {
      await deletePledge.mutateAsync(pledgeToDelete.id);
      showToast("تم حذف التعهد");
    } catch {
      showToast("تعذر حذف التعهد", "error");
    } finally {
      setPledgeToDelete(null);
    }
  }

  async function handleOpenAttachment(downloadUrl, filename, preview = false) {
    if (!downloadUrl) return;
    try {
      const cleanUrl = downloadUrl.startsWith("/") ? downloadUrl.slice(1) : downloadUrl;
      const url = cleanUrl.replace(/^api\//, "");
      const objectUrl = await fetchAuthedBlobUrl(url);

      if (preview) {
        setPreviewBlobUrl(objectUrl);
        setPreviewPledge({ filename, isPdf: filename.toLowerCase().endsWith(".pdf") });
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.target = "_blank";
        link.download = filename || "pledge-attachment";
        link.click();
      }
    } catch {
      showToast("تعذر فتح المرفق", "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-section font-bold text-foreground">سجل التعهدات والالتزامات</h3>
        {canEdit && (
          <Button size="sm" onClick={() => setAddOpen(true)} className="shadow-xs">
            <Plus className="h-4 w-4 me-1.5" />
            إضافة تعهد جديد
          </Button>
        )}
      </div>

      {isLoading ? (
        <EmptyState title="جارِ تحميل التعهدات..." />
      ) : pledges.length === 0 ? (
        <Card className="border border-border/70 bg-card/60">
          <CardContent className="p-8 text-center space-y-3">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
            <p className="text-body font-semibold text-muted-foreground">لا توجد تعهدات مسجلة على ذمة الفرد.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pledges.map((pledge) => (
            <Card key={pledge.id} className="border border-border/80 bg-card/90 backdrop-blur-md shadow-2xs hover:shadow-xs transition-all">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-body font-bold text-foreground">{pledge.title}</h4>
                      {pledge.issue_date && (
                        <span className="text-caption text-muted-foreground font-mono bg-secondary/40 px-2 py-0.5 rounded-md">
                          التاريخ: {formatDate(pledge.issue_date)}
                        </span>
                      )}
                    </div>
                    {pledge.description && (
                      <p className="text-body-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {pledge.description}
                      </p>
                    )}
                    {pledge.original_name && (
                      <p className="text-caption text-primary font-semibold flex items-center gap-1 pt-1">
                        📎 المرفق: <span className="font-mono dir-ltr truncate max-w-xs">{pledge.original_name}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                  {pledge.download_url && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="معاينة المرفق"
                        onClick={() => handleOpenAttachment(pledge.download_url, pledge.original_name, true)}
                      >
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="تحميل المرفق"
                        onClick={() => handleOpenAttachment(pledge.download_url, pledge.original_name, false)}
                      >
                        <Download className="h-4 w-4 text-foreground" />
                      </Button>
                    </>
                  )}
                  {canEdit && (
                    <AlertDialog open={pledgeToDelete?.id === pledge.id} onOpenChange={(open) => !open && setPledgeToDelete(null)}>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="حذف" onClick={() => setPledgeToDelete(pledge)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف التعهد؟</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت تأكد من حذف تعهد «{pledge.title}»؟ سيتم إزالة المرفق إن وجد بشكل نهائي.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel asChild>
                            <Button variant="outline">إلغاء</Button>
                          </AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Button variant="destructive" onClick={handleDelete}>
                              حذف التعهد
                            </Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Pledge Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة تعهد / التزام جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label required>عنوان التعهد / الالتزام</Label>
              <Input
                placeholder="مثال: تعهد بالانضباط العسكري، استلام عهدة..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={form.issue_date}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الوصف والتفاصيل</Label>
              <Textarea
                placeholder="تفاصيل الشروط أو التعهد المسجل..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-24"
              />
            </div>
            <div className="space-y-1.5">
              <Label>المرفق (صورة أو ملف PDF)</Label>
              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border/80 bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-all">
                <Upload className="h-4 w-4 text-primary" />
                <span className="text-caption font-bold text-foreground">
                  {form.attachment ? form.attachment.name : "اختر ملف المرفق..."}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  className="hidden"
                  onChange={(e) => setForm({ ...form, attachment: e.target.files?.[0] || null })}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={createPledge.isPending}>
                حفظ التعهد
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Attachment Preview Modal */}
      <Dialog open={Boolean(previewPledge)} onOpenChange={(open) => !open && setPreviewPledge(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>معاينة المرفق — {previewPledge?.filename}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 flex items-center justify-center min-h-64">
            {previewPledge?.isPdf ? (
              <iframe src={previewBlobUrl} className="w-full h-[65vh] rounded-xl border border-border" title="PDF Preview" />
            ) : (
              <img src={previewBlobUrl} alt="Preview" className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-sm" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
