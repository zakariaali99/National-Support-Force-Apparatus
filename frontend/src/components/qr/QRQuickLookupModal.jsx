import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Search, Car, Package, User, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";

export function QRQuickLookupModal({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleLookup = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    // Simulate smart lookup router based on code prefix or pattern
    setTimeout(() => {
      setSearching(false);
      const clean = query.trim().toUpperCase();

      if (clean.startsWith("M-") || clean.startsWith("NASF-") || !isNaN(clean)) {
        setResult({
          type: "member",
          title: "سجل فرد بالقوة المساندة",
          name: "علي سالم الورفلي",
          code: clean,
          badge: "ملازم أول • الفصيل الأول",
          url: `/members`,
        });
      } else if (clean.startsWith("VEH-") || clean.startsWith("VIN-") || clean.includes("TOYOTA")) {
        setResult({
          type: "vehicle",
          title: "سجل آلية / مركبة",
          name: "تويوتا لاندكروزر مصفحة",
          code: clean,
          badge: "لوحة: 5-48921 • مسلحة (دوشكا)",
          url: `/transportation`,
        });
      } else {
        setResult({
          type: "inventory",
          title: "سجل صنف / عهدة مستودع",
          name: "بندقية كلاشينكوف AK-103",
          code: clean,
          badge: "رقم تسلسلي: AK-99841 • متاح بالمخزن",
          url: `/inventory`,
        });
      }
    }, 300);
  };

  const handleGoToRecord = () => {
    if (result?.url) {
      onOpenChange(false);
      navigate(result.url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 rounded-[28px] border border-slate-200/80 dark:border-white/10 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
          <div className="space-y-1 text-start">
            <DialogTitle className="text-title font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#2B95E8]" />
              <span>التحقق والاستعلام السريع (QR / Code Lookup)</span>
            </DialogTitle>
            <DialogDescription className="text-caption">
              امسح الرمز أو أدخل الرقم التسلسلي للوصول الفوري للسجل
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Quick Search Form */}
          <form onSubmit={handleLookup} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="أدخل كود الـ QR، رقم الهيكل، أو الرقم العسكري..."
                className="pr-10 h-11 rounded-2xl"
                autoFocus
              />
            </div>
            <Button type="submit" variant="primary" disabled={!query.trim() || searching} className="rounded-2xl px-5 font-bold">
              {searching ? "جاري البحث..." : "استعلام"}
            </Button>
          </form>

          {/* Quick examples shortcuts */}
          <div className="flex flex-wrap items-center gap-1.5 text-caption">
            <span className="text-slate-400">نماذج سريعة:</span>
            <button
              type="button"
              onClick={() => { setQuery("AK-99841"); }}
              className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-gray-300 font-mono text-caption cursor-pointer"
            >
              AK-99841 (سلاح)
            </button>
            <button
              type="button"
              onClick={() => { setQuery("VEH-48921"); }}
              className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-gray-300 font-mono text-caption cursor-pointer"
            >
              VEH-48921 (مركبة)
            </button>
            <button
              type="button"
              onClick={() => { setQuery("M-1002"); }}
              className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-gray-300 font-mono text-caption cursor-pointer"
            >
              M-1002 (فرد)
            </button>
          </div>

          {/* Result Card if found */}
          {result && (
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/10 text-[#2B95E8] shadow-xs">
                    {result.type === "vehicle" && <Car className="w-5 h-5" />}
                    {result.type === "inventory" && <Package className="w-5 h-5" />}
                    {result.type === "member" && <User className="w-5 h-5" />}
                  </div>
                  <div className="text-start">
                    <p className="text-caption text-slate-500">{result.title}</p>
                    <h4 className="text-body-sm font-bold text-slate-900 dark:text-white">{result.name}</h4>
                  </div>
                </div>

                <span className="font-mono text-caption px-2 py-0.5 rounded-md bg-white dark:bg-white/10 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/10 font-bold">
                  {result.code}
                </span>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <p className="text-caption text-blue-700 dark:text-blue-300 font-medium">{result.badge}</p>
                <Button size="sm" variant="primary" onClick={handleGoToRecord} className="rounded-xl gap-1 font-bold">
                  <span>فتح السجل</span>
                  <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 rotate-180" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default QRQuickLookupModal;
