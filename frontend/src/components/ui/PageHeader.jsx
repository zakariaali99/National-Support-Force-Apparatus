import { cn } from "../../lib/utils";

/** Standard page title block — one implementation for every page.
 *
 * Replaces the 11 hand-built "h1 + description + action row" headers that had
 * drifted apart (some with `font-black`, some `font-bold`, different
 * descenders). `children` is the action slot and sits to the end side.
 */
export function PageHeader({ title, description, subtitle, actions, action, children, className }) {
  const desc = description || subtitle;
  const actionSlot = actions || action || children;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-title font-bold tracking-tight text-fg">{title}</h1>
        {desc && (
          <p className="text-caption text-fg-subtle max-w-2xl">{desc}</p>
        )}
      </div>
      {actionSlot && <div className="flex flex-wrap items-center gap-2 shrink-0">{actionSlot}</div>}
    </div>
  );
}