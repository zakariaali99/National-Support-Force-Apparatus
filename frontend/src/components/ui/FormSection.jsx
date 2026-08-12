import { cn } from "../../lib/utils";

/** Title block for a group of form fields.
 *
 * Replaces MemberForm's ad-hoc `space-y-4` sections with their hand-drawn
 * `border-b` + icon + `<h3>` headers, giving every form one consistent section
 * rhythm.
 */
export function FormSection({ icon: Icon, title, description, children, className }) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {Icon && <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />}
        <div className="min-w-0">
          <h3 className="text-section font-bold text-fg">{title}</h3>
          {description && <p className="text-caption text-fg-subtle">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}