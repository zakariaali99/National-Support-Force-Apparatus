import { cn } from "../../lib/utils";

/** One key/value cell inside a DetailGrid.
 *
 * `dir` isolates an LTR value (force number, phone, national number) so the
 * bidi algorithm cannot reorder it inside the RTL page; the `<Num>` primitive
 * does the same job for bare numerals embedded in tables.
 */
export function DetailItem({ icon: Icon, label, value, dir, className }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 p-3 rounded-xl border border-border bg-surface-raised",
        className
      )}
    >
      {Icon && (
        <div className="p-2.5 bg-primary/10 text-primary rounded-lg shrink-0">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-caption font-semibold text-fg-subtle">{label}</p>
        <p className="text-label font-bold text-fg mt-0.5 truncate" dir={dir}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

/** Responsive key/value grid. Replaces MemberDetail's local DetailItem and its
 *  `text-[10px]` labels.
 */
export function DetailGrid({ children, className }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}