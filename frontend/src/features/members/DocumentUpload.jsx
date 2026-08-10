import { useState } from "react";

import { Download, Trash2, Upload } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { createResourceHooks } from "../../lib/createResourceHooks";
import { useAuth } from "../auth/AuthContext";
import {
  fetchAuthedBlobUrl,
  useDeleteMemberDocument,
  useMemberDocuments,
  useUploadMemberDocument,
} from "./api";

const documentTypesApi = createResourceHooks("document-types", "document-types/");

async function openDocument(url, filename) {
  const objectUrl = await fetchAuthedBlobUrl(url);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.target = "_blank";
  link.rel = "noopener";
  link.download = filename ?? "";
  link.click();
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
  const [uploading, setUploading] = useState(false);

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedType) return;
    setUploading(true);
    try {
      await uploadDocument.mutateAsync({ member: memberId, document_type: selectedType, file });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc) {
    if (window.confirm(`حذف المستند "${doc.original_name}"؟`)) {
      await deleteDocument.mutateAsync(doc.id);
    }
  }

  if (!canView) return null;

  return (
    <div className="space-y-3">
      {canUpload && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="max-w-56"
          >
            <option value="">اختر نوع المستند</option>
            {documentTypes.map((dt) => (
              <option key={dt.id} value={dt.id}>
                {dt.name_ar}
              </option>
            ))}
          </Select>
          <label>
            <span
              className={
                "inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-secondary" +
                (!selectedType || uploading ? " pointer-events-none opacity-50" : "")
              }
            >
              <Upload className="h-4 w-4" />
              {uploading ? "جارِ الرفع..." : "رفع مستند"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              className="hidden"
              disabled={!selectedType || uploading}
              onChange={handleFileSelected}
            />
          </label>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">جارِ التحميل...</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد مستندات مرفوعة بعد</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{doc.document_type_name}</p>
                <p className="truncate text-xs text-muted-foreground">{doc.original_name}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="تنزيل"
                  onClick={() => openDocument(doc.download_url, doc.original_name)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {canUpload && (
                  <Button variant="ghost" size="icon" aria-label="حذف" onClick={() => handleDelete(doc)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
