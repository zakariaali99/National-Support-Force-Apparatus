import { Inbox } from "lucide-react";

import { cn } from "../../lib/utils";

/** Standard "there's nothing here yet" panel.
 *
 * Replaces the several one-off empty treatments that had drifted apart
 * across pages (bare `<p class="text-muted-foreground">` in some, a bordered
 * dashed box in others). `action` takes a Button/Link for the obvious next
 * step, e.g. "add the first member".
 */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 rounded-card border border-dashed border-border bg-card p-12 text-center",
        className
      )}
    >
      <Icon className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
      <h3 className="text-h3 text-foreground">{title}</h3>
      {description && <p className="text-caption text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
