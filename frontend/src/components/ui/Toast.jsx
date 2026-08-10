import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { cn } from "../../lib/utils";

let toastId = 0;

export function showToast(message, type = "success") {
  const event = new CustomEvent("nsfa:toast", {
    detail: { id: ++toastId, message, type },
  });
  window.dispatchEvent(event);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function handleToast(e) {
      const { id, message, type } = e.detail;
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }

    window.addEventListener("nsfa:toast", handleToast);
    return () => window.removeEventListener("nsfa:toast", handleToast);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 start-4 z-50 flex flex-col gap-2 w-[min(90vw,22rem)] pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-4 shadow-xl pointer-events-auto animate-slide-up",
              isSuccess
                ? "bg-card border-success/30 text-foreground dark:border-success/50"
                : "bg-card border-destructive/30 text-foreground dark:border-destructive/50"
            )}
            role="alert"
          >
            {isSuccess ? (
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            )}
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-muted-foreground hover:text-foreground shrink-0 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
