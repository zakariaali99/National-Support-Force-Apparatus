import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./Dialog";
import { Button } from "./Button";
import { useAuth } from "../../features/auth/AuthContext";

export function PermissionDeniedDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [requiredPerm, setRequiredPerm] = useState("");

  useEffect(() => {
    function handleForbidden(e) {
      const detail = e.detail || {};
      setMessage(detail.message || "عفواً، لا يمتلك حسابك الحالي الصلاحية الأمنية الكافية لإتمام هذا الإجراء أو الوصول إلى هذه البيانات.");
      setRequiredPerm(detail.permission || "");
      setOpen(true);
    }

    window.addEventListener("nsfa:forbidden", handleForbidden);
    return () => window.removeEventListener("nsfa:forbidden", handleForbidden);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0 rounded-[28px] border border-rose-200 dark:border-rose-900/40 overflow-hidden bg-white dark:bg-[#1A2038] shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-rose-100 dark:border-rose-950/30 bg-rose-50/50 dark:bg-rose-950/20 text-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800/40 shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-title font-bold text-rose-950 dark:text-rose-200">
                تنبيه أمني — حظر الوصول
              </DialogTitle>
              <DialogDescription className="text-caption text-rose-700/80 dark:text-rose-300/80 font-medium">
                غير مصرح لحسابك بتنفيذ هذه العملية
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 text-start">
          {/* Main Alert Message */}
          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/30 text-body-sm font-semibold text-rose-950 dark:text-rose-100 leading-relaxed">
            {message || "عفواً، لا يمتلك حسابك الحالي الصلاحية الأمنية الكافية لإتمام هذا الإجراء أو الوصول إلى هذه البيانات."}
          </div>

          {/* Account Context Details */}
          {user && (
            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 space-y-1.5 text-caption">
              <div className="flex items-center justify-between text-slate-600 dark:text-gray-300 font-bold">
                <span>الاسم الكامل:</span>
                <span className="text-slate-900 dark:text-white font-bold">{user.full_name || user.username}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 font-bold">
                <span>اسم الحساب:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 dir-ltr">{user.username}</span>
              </div>
              {requiredPerm && (
                <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 font-bold pt-1 border-t border-slate-200/60 dark:border-white/10">
                  <span>الصلاحية المطلوبة:</span>
                  <span className="font-mono text-micro bg-amber-500/10 px-2 py-0.5 rounded dir-ltr">{requiredPerm}</span>
                </div>
              )}
            </div>
          )}

          <p className="text-caption text-slate-500 dark:text-gray-400 font-medium text-center">
            إذا كنت بحاجة إلى هذه الصلاحية لإتمام مهام عملك، يرجى مراجعة إدارة المنظومة ورئيس شعبة الشؤون الإدارية.
          </p>
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl px-6 font-bold">
            حسناً، فهمت ذلك
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PermissionDeniedDialog;
