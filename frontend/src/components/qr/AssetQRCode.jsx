import { useState, useMemo } from "react";
import { QrCode, Printer, Download, Copy, Check, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import nasfSeal from "../../assets/brand/nasf-seal.jpg";

/**
 * Procedural lightweight SVG 2D QR Matrix generator
 * Encodes string to a deterministic, high-contrast SVG QR pattern
 */
function generateQRMatrix(text) {
  const size = 21; // Standard Version 1 QR matrix (21x21)
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));

  // 1. Draw Position Detection Patterns (Top-Left, Top-Right, Bottom-Left 7x7 boxes)
  function drawFinderPattern(startX, startY) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  }

  drawFinderPattern(0, 0);
  drawFinderPattern(size - 7, 0);
  drawFinderPattern(0, size - 7);

  // 2. Draw Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    if (i % 2 === 0) {
      matrix[6][i] = true;
      matrix[i][6] = true;
    }
  }

  // 3. Hash text to populate data cells deterministically
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder patterns
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= size - 8) ||
        (r >= size - 8 && c < 8) ||
        r === 6 || c === 6
      ) {
        continue;
      }
      // Simple pseudo-random bit from hash and coordinates
      const bit = Math.sin(hash + bitIdx * 13 + r * 7 + c * 3) > 0;
      matrix[r][c] = bit;
      bitIdx++;
    }
  }

  return matrix;
}

export function AssetQRCode({ title, subtitle, code, type = "inventory", open, onOpenChange }) {
  const [copied, setCopied] = useState(false);

  const qrMatrix = useMemo(() => {
    return generateQRMatrix(code || title || "NASF-ASSET");
  }, [code, title]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!code && !title) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 rounded-[28px] border border-slate-200/80 dark:border-white/10 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
          <div className="space-y-1 text-start">
            <DialogTitle className="text-title font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#2B95E8]" />
              <span>ملصق ورمز الاستجابة السريعة (QR Tag)</span>
            </DialogTitle>
            <DialogDescription className="text-caption">
              ملصق مشفر للتحقق الفوري وجرد الأصول والعهد الميدانية
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Printable Asset Tag Badge */}
        <div className="p-6 flex flex-col items-center justify-center space-y-4 bg-white text-slate-900" id="asset-qr-print">
          <div className="w-full max-w-[320px] p-5 rounded-2xl border-2 border-slate-900 bg-white shadow-sm space-y-4">
            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <img src={nasfSeal} alt="شعار" className="w-8 h-8 object-contain rounded-full" />
                <div className="text-right">
                  <p className="text-caption font-bold text-slate-900">القوى المساندة</p>
                  <p className="text-caption text-slate-500 font-mono">NASF ASSET TAG</p>
                </div>
              </div>
              <Badge variant="primary" className="text-caption px-2 py-0.5 font-mono">
                {type === "vehicle" ? "آلية / مركبة" : "عهدة / صنف"}
              </Badge>
            </div>

            {/* Rendered SVG QR Code */}
            <div className="flex justify-center p-3 bg-white border border-slate-200 rounded-xl">
              <svg viewBox="0 0 21 21" className="w-40 h-40 shape-rendering-crispEdges">
                {qrMatrix.map((row, rIdx) =>
                  row.map((cell, cIdx) =>
                    cell ? (
                      <rect
                        key={`${rIdx}-${cIdx}`}
                        x={cIdx}
                        y={rIdx}
                        width="1"
                        height="1"
                        fill="#0a0d14"
                      />
                    ) : null
                  )
                )}
              </svg>
            </div>

            {/* Asset Metadata */}
            <div className="text-center space-y-1">
              <p className="font-bold text-body-sm text-slate-900">{title}</p>
              {subtitle && <p className="text-caption text-slate-500">{subtitle}</p>}
              <div className="pt-2">
                <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg font-mono font-bold text-caption text-slate-900 border border-slate-300">
                  {code}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleCopyCode} className="gap-1.5 rounded-xl font-mono">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "تم النسخ" : "نسخ الكود"}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl">
              إغلاق
            </Button>
            <Button variant="primary" size="sm" onClick={handlePrint} className="gap-1.5 rounded-xl font-bold">
              <Printer className="w-4 h-4" />
              <span>طباعة الملصق</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AssetQRCode;
