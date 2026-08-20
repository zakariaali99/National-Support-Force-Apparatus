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
import { Badge } from "../../components/ui/Badge";
import { AuthedImage } from "../../components/ui/AuthedImage";
import { Checkbox } from "../../components/ui/Checkbox";
import { showToast } from "../../components/ui/Toast";
import { useReportSections, openAuthedPdf, downloadAuthedFile, printAuthedHtml } from "../reports/api";
import { printMemberProfileInNewWindow } from "../../lib/printUtils";
import { useMemberDocuments } from "./api";

export function PrintDialog({ member, open: controlledOpen, onOpenChange: setControlledOpen, trigger }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  function handleOpenChange(newVal) {
    if (isControlled) {
      setControlledOpen?.(newVal);
    } else {
      setInternalOpen(newVal);
    }
  }

  const { data: sections = [] } = useReportSections();
  const { data: documents = [] } = useMemberDocuments(member?.id);

  const [selectedSections, setSelectedSections] = useState(() => new Set(["profile"]));
  const [selectedDocuments, setSelectedDocuments] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const checklistRef = useRef(null);

  // Reset selections when modal opens for a member
  useEffect(() => {
    if (isOpen) {
      setSelectedSections(new Set(["profile", "notes", "tasks", "evaluations", "vacation", "pledges"]));
      setSelectedDocuments(new Set());
    }
  }, [isOpen, member?.id]);

  useEffect(() => {
    if (isOpen && checklistRef.current && sections.length > 0) {
      const tween = staggerIn(checklistRef.current.querySelectorAll(".section-option"), { y: 8, duration: 0.2 });
      return () => {
        if (tween) tween.kill();
      };
    }
  }, [isOpen, sections.length, documents.length]);

  if (!member) return null;

  function toggleSection(key) {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleDocument(id) {
    setSelectedDocuments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSectionsSelected = sections.length > 0 && selectedSections.size === sections.length;

  function toggleAllSections() {
    if (allSectionsSelected) {
      setSelectedSections(new Set());
    } else {
      setSelectedSections(new Set(sections.map((s) => s.key)));
    }
  }

  function buildUrl() {
    const params = new URLSearchParams();
    if (selectedSections.size > 0) {
      params.set("sections", Array.from(selectedSections).join(","));
    }
    if (selectedDocuments.size > 0) {
      params.set("documents", Array.from(selectedDocuments).join(","));
    }
    return `reports/members/${member.id}/print/?${params.toString()}`;
  }

  async function handlePrint(download) {
    if (selectedSections.size === 0 && selectedDocuments.size === 0) {
      showToast("يرجى تحديد قسم واحد على الأقل للطباعة", "error");
      return;
    }
    setBusy(true);
    try {
      if (download) {
        const url = buildUrl() + "&download=1";
        await downloadAuthedFile(url, `ملف_${member.force_number}_${member.full_name}.pdf`);
        showToast("تم بدء تنزيل ملف PDF", "success");
      } else {
        const url = buildUrl() + "&html=1";
        printAuthedHtml(url);
      }
      handleOpenChange(false);
    } catch (err) {
      console.error("Print error:", err);
      const errMsg = err?.response?.data?.detail || (typeof err?.response?.data === "string" ? err.response.data : null) || "تعذر إنشاء وتجهيز ملف الطباعة";
      showToast(errMsg, "error");
    } finally {
      setBusy(false);
    }
  }

  const dialogContent = (
    <DialogContent className="w-[min(94vw,36rem)] max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border border-border/80 shadow-md">
      {/* Header Banner */}
      <DialogHeader className="p-5 bg-card border-b border-border/80 space-y-3 text-start">
        <div className="flex items-center justify-between">
          <DialogTitle className="text-section font-bold text-foreground flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            <span>طباعة وتصدير ملف الفرد</span>
          </DialogTitle>
          <Badge variant="outline" className="font-mono text-caption" data-num>
            {member.force_number}
          </Badge>
        </div>

        {/* Member Quick Summary Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-secondary/30">
          <div className="h-12 w-12 rounded-xl bg-card border border-border/60 overflow-hidden shrink-0 flex items-center justify-center font-bold text-primary text-section">
            {member.photo ? (
              <AuthedImage src={member.photo} alt={member.full_name} className="h-full w-full object-cover" />
            ) : (
              member.full_name?.charAt(0) || "ع"
            )}
          </div>
          <div className="space-y-0.5 text-start min-w-0 flex-1">
            <h4 className="font-bold text-body text-foreground truncate">{member.full_name}</h4>
            <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground font-semibold">
              {member.rank_name && <span>الرتبة: <strong className="text-foreground">{member.rank_name}</strong></span>}
              {member.faction_name && <span>| الإدارة: <strong className="text-foreground">{member.faction_name}</strong></span>}
            </div>
          </div>
        </div>
      </DialogHeader>

      {/* Main Options Checklist Body */}
      <div ref={checklistRef} className="p-5 space-y-4 overflow-y-auto max-h-[55vh] flex-1">
        {/* Sections Header */}
        <div className="flex items-center justify-between pb-1 border-b border-border/60">
          <span className="text-caption font-bold text-foreground">الأقسام والتقرير المطلوب:</span>
          <button
            type="button"
            onClick={toggleAllSections}
            className="text-caption font-bold text-primary hover:underline flex items-center gap-1"
          >
            {allSectionsSelected ? "إلغاء تحديد الكل" : "تحديد كافة الأقسام"}
          </button>
        </div>

        {/* Section Cards List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {sections.map((s) => {
            const isSelected = selectedSections.has(s.key);
            return (
              <label
                key={s.key}
                onClick={() => toggleSection(s.key)}
                className={`section-option p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? "border-primary bg-primary/5 text-foreground font-semibold shadow-xs"
                    : "border-border/80 bg-card hover:bg-secondary/40 text-muted-foreground"
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSection(s.key)}
                  className="pointer-events-none"
                />
                <span className="text-label text-start leading-snug">{s.label_ar}</span>
              </label>
            );
          })}
        </div>

        {/* Documents Section if Available */}
        {documents.length > 0 && (
          <div className="space-y-2.5 pt-3 border-t border-border/80">
            <span className="text-caption font-bold text-foreground block">المستندات والوثائق المرفقة:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {documents.map((d) => {
                const isSelected = selectedDocuments.has(d.id);
                return (
                  <label
                    key={d.id}
                    onClick={() => toggleDocument(d.id)}
                    className={`section-option p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground font-semibold shadow-xs"
                        : "border-border/80 bg-card hover:bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleDocument(d.id)}
                      className="pointer-events-none"
                    />
                    <span className="text-label text-start truncate">{d.document_type_name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <DialogFooter className="p-4 bg-card border-t border-border/80 flex-row gap-2 sm:justify-end">
        <Button variant="outline" size="sm" disabled={busy} onClick={() => handlePrint(true)} className="font-bold">
          {busy ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Download className="h-4 w-4 me-1.5 text-primary" />}
          تنزيل PDF
        </Button>
        <Button size="sm" disabled={busy} onClick={() => handlePrint(false)} className="font-bold shadow-xs">
          {busy ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Printer className="h-4 w-4 me-1.5" />}
          فتح ومعاينة الطباعة
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  if (isControlled) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="font-bold shadow-xs">
            <Printer className="h-4 w-4 me-1.5 shrink-0" />
            <span>طباعة الملف</span>
          </Button>
        )}
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
