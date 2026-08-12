import { useState } from "react";
import { Download, Eye, FileText, ImageIcon, Trash2, Upload } from "lucide-react";

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
import { Select } from "../../components/ui/Select";
import { showToast } from "../../components/ui/Toast";
import { createResourceHooks } from "../../lib/createResourceHooks";
import { formatDate } from "../../lib/format";
import { useAuth } from "../auth/AuthContext";
import {
  fetchAuthedBlobUrl,
  useDeleteMemberDocument,
  useMemberDocuments,
  useUploadMemberDocument,
} from "./api";

const documentTypesApi = createResourceHooks("document-types", "document-types/");

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function DocumentUpload({ memberId }) {
  const { hasPermission } = useAuth();
  const canUpload = hasPermission("document.upload");
  const canView = hasPermission("document.view");

  const { data: documentTypes = [] } = documentTypesApi.useList({ ordering: "print_order" });
  const { data: documents = [], isLoading } = useMemberDocuments(memberId);
  const uploadDocument = useUploadMemberDocument();
  const deleteDocument = useDeleteMemberDocument(memberId);

  const [selectedType, setSelectedType] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState("");

  const selectedDocTypeObj = documentTypes.find((d) => String(d.id) === String(selectedType));
  const isOtherType = selectedDocTypeObj?.code === "other" || selectedDocTypeObj?.name_ar === "أخرى";

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedType) return;

    if (isOtherType && !customTitle.trim()) {
      showToast("يرجى كتابة اسم/عنوان المستند عند اختيار (أخرى)", "error");
      return;
    }

    setUploading(true);
    try {
      await uploadDocument.mutateAsync({
        member: memberId,
        document_type: selectedType,
        title: isOtherType ? customTitle.trim() : "",
        file,
      });
      setCustomTitle("");
      setSelectedType("");
      showToast("تم رفع المستند بنجاح");
    } catch {
      showToast("تعذر رفع المستند", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!docToDelete) return;
    try {
      await deleteDocument.mutateAsync(docToDelete.id);
      showToast("تم حذف المستند");
    } catch {
      showToast("تعذر حذف المستند", "error");
    } finally {
      setDocToDelete(null);
    }
  }

  async function handleOpenDocument(url, filename, preview = false) {
    if (!url) return;
    try {
      const cleanUrl = url.startsWith("/") ? url.slice(1) : url;
      const apiCleanUrl = cleanUrl.replace(/^api\//, "");
      const objectUrl = await fetchAuthedBlobUrl(apiCleanUrl);

      if (preview) {
        setPreviewBlobUrl(objectUrl);
        setPreviewDoc({ filename, isPdf: filename.toLowerCase().endsWith(".pdf") });
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.target = "_blank";
        link.download = filename || "document";
        link.click();
      }
    } catch {
      showToast("تعذر فتح المستند", "error");
    }
  }

  if (!canView) return null;

  return (
    <div className="space-y-4">
      {/* Upload Controls */}
      {canUpload && (
        <div className="p-4 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-xs space-y-3">
          <p className="text-caption font-bold text-muted-foreground">رفع مستند جديد للملف</p>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="max-w-64"
            >
              <option value="">اختر نوع المستند...</option>
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name_ar}
                </option>
              ))}
            </Select>

            {isOtherType && (
              <Input
                placeholder="عنوان المستند (مثال: شهادة خبرة)..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="max-w-64"
              />
            )}

            <label>
              <span
                className={
                  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-caption font-bold text-primary hover:bg-primary/20 transition-all" +
                  (!selectedType || (isOtherType && !customTitle.trim()) || uploading ? " pointer-events-none opacity-50" : "")
                }
              >
                <Upload className="h-4 w-4" />
                {uploading ? "جارِ الرفع..." : "اختر الملف وارفعه"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                className="hidden"
                disabled={!selectedType || (isOtherType && !customTitle.trim()) || uploading}
                onChange={handleFileSelected}
              />
            </label>
          </div>
        </div>
      )}

      {/* Documents List Cards */}
      {isLoading ? (
        <EmptyState title="جارِ تحميل المستندات..." />
      ) : documents.length === 0 ? (
        <EmptyState title="لا توجد مستندات مرفوعة لهذا الفرد بعد." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.map((doc) => {
            const isPdf = doc.original_name.toLowerCase().endsWith(".pdf");
            const displayTitle = doc.title || doc.document_type_name;

            return (
              <Card key={doc.id} className="border border-border/80 bg-card/90 backdrop-blur-md shadow-2xs hover:shadow-xs transition-all">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-3 rounded-xl shrink-0 ${isPdf ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                      {isPdf ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="font-bold text-body text-foreground truncate">{displayTitle}</h4>
                      <p className="truncate text-caption text-muted-foreground font-mono dir-ltr">{doc.original_name}</p>
                      <div className="flex items-center gap-2 text-caption text-muted-foreground pt-0.5">
                        <span>{formatBytes(doc.file_size)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="معاينة"
                      onClick={() => handleOpenDocument(doc.download_url, doc.original_name, true)}
                    >
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="تنزيل"
                      onClick={() => handleOpenDocument(doc.download_url, doc.original_name, false)}
                    >
                      <Download className="h-4 w-4 text-foreground" />
                    </Button>

                    {canUpload && (
                      <AlertDialog open={docToDelete?.id === doc.id} onOpenChange={(open) => !open && setDocToDelete(null)}>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="حذف" onClick={() => setDocToDelete(doc)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف المستند؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              سيتم حذف مستند «{doc.original_name}» نهائيًا ولا يمكن التراجع عن هذه العملية.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel asChild>
                              <Button variant="outline">إلغاء</Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button variant="destructive" onClick={handleDelete}>
                                حذف المستند
                              </Button>
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Document Preview Modal */}
      <Dialog open={Boolean(previewDoc)} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>معاينة المستند — {previewDoc?.filename}</DialogTitle>
          </DialogHeader>
          <div className="py-2 flex items-center justify-center min-h-64">
            {previewDoc?.isPdf ? (
              <iframe src={previewBlobUrl} className="w-full h-[70vh] rounded-xl border border-border" title="PDF Preview" />
            ) : (
              <img src={previewBlobUrl} alt="Document Preview" className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-sm" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
