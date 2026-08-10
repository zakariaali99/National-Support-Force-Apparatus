import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "./Button";
import { cn } from "../../lib/utils";

/** Standard "this failed to load" panel, with an optional retry.
 *
 * Deliberately does NOT surface the raw error/response body: these screens
 * show personnel records, and an unfiltered DRF error can leak field names,
 * ids, or query details to someone who shouldn't see them. Pass a short
 * Arabic `description` for anything the user can act on.
 */
export function ErrorState({
  title = "تعذر تحميل البيانات",
  description = "حدث خطأ أثناء الاتصال بالنظام. حاول مرة أخرى.",
  onRetry,
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 rounded-card border border-destructive/20 bg-destructive/5 p-12 text-center",
        className
      )}
    >
      <AlertTriangle className="h-12 w-12 text-destructive/60" aria-hidden="true" />
      <h3 className="text-h3 text-foreground">{title}</h3>
      <p className="text-caption text-muted-foreground max-w-sm">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
