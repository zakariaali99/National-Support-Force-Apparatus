import { useLayoutEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

let toastId = 0;

export function showToast(param, typeParam = "success") {
  let title = "";
  let description = "";
  let type = typeParam;

  if (typeof param === "object" && param !== null) {
    title = param.title || param.message || "";
    description = param.description || "";
    type = param.type || typeParam || "success";
  } else {
    title = String(param || "");
  }

  const event = new CustomEvent("nsfa:toast", {
    detail: { id: ++toastId, title, description, type },
  });
  window.dispatchEvent(event);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useLayoutEffect(() => {
    function handleToast(e) {
      const { id, title, description, type } = e.detail;
      setToasts((prev) => [...prev, { id, title, description, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    }

    window.addEventListener("nsfa:toast", handleToast);
    return () => window.removeEventListener("nsfa:toast", handleToast);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 start-5 z-50 flex flex-col gap-2.5 w-[min(92vw,24rem)] pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error" || toast.type === "danger";
        const isWarning = toast.type === "warning";

        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4 shadow-2xl pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200 backdrop-blur-md",
              isSuccess
                ? "bg-white/95 dark:bg-[#1A2038]/95 border-emerald-500/40 text-slate-900 dark:text-white ring-1 ring-emerald-500/20"
                : isWarning
                ? "bg-white/95 dark:bg-[#1A2038]/95 border-amber-500/50 text-slate-900 dark:text-white ring-1 ring-amber-500/20"
                : isError
                ? "bg-white/95 dark:bg-[#1A2038]/95 border-rose-500/40 text-slate-900 dark:text-white ring-1 ring-rose-500/20"
                : "bg-white/95 dark:bg-[#1A2038]/95 border-blue-500/40 text-slate-900 dark:text-white ring-1 ring-blue-500/20"
            )}
            role="alert"
          >
            {isSuccess ? (
              <div className="p-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            ) : isWarning ? (
              <div className="p-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
            ) : isError ? (
              <div className="p-1 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
            ) : (
              <div className="p-1 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#2B95E8] shrink-0">
                <Info className="h-5 w-5" />
              </div>
            )}

            <div className="flex-1 min-w-0 text-start space-y-0.5">
              {toast.title && <p className="text-body-sm font-bold text-slate-900 dark:text-white">{toast.title}</p>}
              {toast.description && (
                <p className="text-caption text-slate-600 dark:text-gray-300 font-medium leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0 rounded-lg p-1 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastContainer;
