import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import sealUrl from "../../assets/brand/nasf-seal.jpg";
import { cn } from "../../lib/utils";
import { NAV_ITEMS } from "./navConfig";

export function SidebarContent({ onNavigate }) {
  const { user, hasPermission } = useAuth();

  const allowedItems = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  // Group items dynamically for executive visual grouping
  const groups = [
    {
      title: "العامة",
      items: allowedItems.filter((i) => i.to === "/" || i.to.startsWith("/members")),
    },
    {
      title: "الهيكل التنظيمي",
      items: allowedItems.filter((i) => i.to.startsWith("/organization")),
    },
    {
      title: "الضبط والتهيئة",
      items: allowedItems.filter((i) => i.to.startsWith("/settings")),
    },
  ];

  return (
    <div className="flex h-full flex-col bg-sidebar border-e border-sidebar-border shadow-sm">
      {/* Header Logo */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-5 bg-secondary/20">
        <img
          src={sealUrl}
          alt="شعار الجهاز الوطني للقوى المساندة"
          className="h-11 w-11 shrink-0 rounded-full object-cover shadow border border-border"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-foreground">الجهاز الوطني</p>
          <p className="truncate text-xs font-semibold text-primary">للقوى المساندة</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-6 overflow-y-auto p-4 scrollbar-thin">
        {groups.map(
          (group) =>
            group.items.length > 0 && (
              <div key={group.title} className="space-y-1.5 animate-fade-in">
                <h3 className="px-3 text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{label}</span>
                          {/* Active gold highlight indicator */}
                          {isActive && (
                            <span className="absolute start-0 top-1.5 bottom-1.5 w-1 rounded-full bg-accent" />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
        )}
      </nav>

      {/* Footer User Profile Summary */}
      <div className="border-t border-sidebar-border p-4 bg-secondary/10 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 border border-border shadow-inner">
          {user?.first_name?.charAt(0) || user?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-foreground">
            {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username}
          </p>
          <p className="truncate text-[10px] text-muted-foreground font-medium">
            {user?.is_superuser ? "مدير النظام الأساسي" : "مستخدم مصدق"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ className }) {
  return (
    <aside
      className={cn(
        "sticky top-0 h-screen w-64 shrink-0 bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <SidebarContent />
    </aside>
  );
}
