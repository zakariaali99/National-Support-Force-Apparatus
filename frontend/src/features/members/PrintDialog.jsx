import { useEffect, useRef, useState } from "react";
import { Printer, Download, Loader2 } from "lucide-react";

import { Button } from "../../components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/Dialog";
import { showToast } from "../../components/ui/Toast";
import { staggerIn } from "../../lib/motion";
import { useReportSections, openAuthedPdf, downloadAuthedFile } from "../reports/api";
import { useMemberDocuments } from "./api";

export function PrintDialog({ member }) {
  const { data: sections = [] } = useReportSections();
  const { data: documents = [] } = useMemberDocuments(member.id);
  const [selectedSections, setSelectedSections] = useState(() => new Set(["profile"]));
  const [selectedDocuments, setSelectedDocuments] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const checklistRef = useRef(null);

  useEffect(() => {
    if (checklistRef.current && sections.length > 0) {
      const tween = staggerIn(checklistRef.current.querySelectorAll("label"), { y: 8, duration: 0.2 });
      return () => {
        if (tween) tween.kill();
      };
    }
  }, [sections.length, documents.length]);

  function toggle(set, setSet, key) {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSet(next);
  }

  function selectAll() {
    setSelectedSections(new Set(sections.map((s) => s.key)));
    setSelectedDocuments(new Set(documents.map((d) => d.id)));
  }

  function buildUrl() {
    const params = new URLSearchParams();
    params.set("sections", Array.from(selectedSections).join(","));
    if (selectedDocuments.size > 0) {
      params.set("documents", Array.from(selectedDocuments).join(","));
    }
    return `members/${member.id}/print/?${params.toString()}`;
  }

  async function handlePrint(download) {
    if (selectedSections.size === 0 && selectedDocuments.size === 0) {
      showToast("اختر عنصراً واحداً على الأقل للطباعة", "error");
      return;
    }
    setBusy(true);
    try {
      const url = buildUrl() + (download ? "&download=1" : "");
      if (download) {
        await downloadAuthedFile(url, `${member.force_number}-profile.pdf`);
      } else {
        await openAuthedPdf(url);
      }
    } catch {
      showToast("تعذر إنشاء ملف الطباعة", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="shadow-sm">
          <Printer className="h-4 w-4 shrink-0" />
          <span>طباعة</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[min(92vw,32rem)]">
        <DialogHeader>
          <DialogTitle>طباعة ملف العضو</DialogTitle>
        </DialogHeader>

        <div ref={checklistRef} className="space-y-4 max-h-[50vh] overflow-y-auto pe-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-foreground">الأقسام</p>
            <button type="button" onClick={selectAll} className="text-[10px] font-bold text-primary hover:opacity-80">
              تحديد الكل
            </button>
          </div>
          <div className="space-y-1.5">
            {sections.map((s) => (
              <label key={s.key} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                <input
                  type="checkbox"
                  checked={selectedSections.has(s.key)}
                  onChange={() => toggle(selectedSections, setSelectedSections, s.key)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                {s.label_ar}
              </label>
            ))}
          </div>

          {documents.length > 0 && (
            <>
              <p className="text-xs font-bold text-foreground pt-2 border-t border-border/50">المستندات المرفقة</p>
              <div className="space-y-1.5">
                {documents.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.has(d.id)}
                      onChange={() => toggle(selectedDocuments, setSelectedDocuments, d.id)}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    />
                    {d.document_type_name}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => handlePrint(true)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            تنزيل PDF
          </Button>
          <Button size="sm" disabled={busy} onClick={() => handlePrint(false)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            فتح للطباعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
