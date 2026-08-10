import { NavLink } from "react-router-dom";

import sealUrl from "../../assets/brand/nasf-seal.jpg";
import { cn } from "../../lib/utils";
import { NAV_ITEMS } from "./navConfig";

export function SidebarContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
        <img
          src={sealUrl}
          alt="شعار الجهاز الوطني للقوى المساندة"
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">الجهاز الوطني</p>
          <p className="truncate text-xs text-muted-foreground">للقوى المساندة</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function Sidebar({ className }) {
  return (
    <aside
      className={cn(
        "sticky top-0 h-screen w-64 shrink-0 border-e border-sidebar-border bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <SidebarContent />
    </aside>
  );
}
