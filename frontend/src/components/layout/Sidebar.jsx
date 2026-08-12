import { useState } from "react";
import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import sealUrl from "../../assets/brand/nasf-seal.jpg";
import { cn } from "../../lib/utils";
import { NAV_GROUPS } from "./navConfig";

export function SidebarContent({ onNavigate, collapsed = false, onToggleCollapse }) {
  const { user, hasPermission, logout } = useAuth();
  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(NAV_GROUPS.map((g) => [g.id, true]))
  );

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || hasPermission(item.permission)),
  })).filter((group) => group.items.length > 0);

  function toggleSection(id) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="flex h-full flex-col bg-card border-e border-border/80 shadow-xs transition-all duration-300">
      {/* Header Logo & Collapse Toggle Button */}
      <div
        className={cn(
          "flex items-center justify-between border-b border-border/80 p-3 bg-secondary/30",
          collapsed && "flex-col items-center gap-2 p-2"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
          <img
            src={sealUrl}
            alt="شعار الجهاز الوطني"
            className="h-9 w-9 shrink-0 rounded-xl object-cover border border-border/80"
          />
          {!collapsed && (
            <div className="min-w-0 text-start">
              <p className="truncate text-label font-bold text-foreground">الجهاز الوطني للقوى المساندة</p>
              <p className="truncate text-caption text-primary font-bold">الوحدة القتالية الرابعة</p>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-xl text-foreground bg-card hover:bg-secondary border border-border/80 shadow-xs transition-all flex items-center justify-center shrink-0"
            title={collapsed ? "فتح القائمة" : "طي القائمة"}
          >
            {collapsed ? <PanelLeftClose className="h-4.5 w-4.5 text-primary" /> : <PanelLeftOpen className="h-4.5 w-4.5 text-muted-foreground" />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className={cn("flex-1 overflow-y-auto scrollbar-thin", collapsed ? "p-2 space-y-3 flex flex-col items-center" : "p-3 space-y-3")}>
        {groups.map((group) => {
          if (group.items.length === 0) return null;

          // When collapsed, render every section's row icons clearly centered
          if (collapsed) {
            return (
              <div key={group.id} className="space-y-2 w-full flex flex-col items-center">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={label}
                    aria-label={label}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all font-bold shrink-0 mx-auto border shadow-2xs",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-card text-foreground hover:bg-secondary hover:text-primary border-border/80"
                      )
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                  </NavLink>
                ))}
              </div>
            );
          }

          // When expanded, render section header + slightly smaller row items
          const isOpen = openSections[group.id] ?? true;
          return (
            <div key={group.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleSection(group.id)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-caption font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <span>{group.title}</span>
                {isOpen ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {isOpen && (
                <div className="space-y-1 pt-0.5">
                  {group.items.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2.5 rounded-lg h-8.5 px-2.5 text-caption font-bold transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-foreground hover:bg-secondary hover:text-primary"
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate text-start">{label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Profile Card & Logout Button */}
      <div
        className={cn(
          "border-t border-border/80 p-3 bg-secondary/10 flex items-center justify-between gap-2",
          collapsed && "flex-col justify-center p-2"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-caption shrink-0 border border-primary/20 shadow-xs">
            {user?.first_name?.charAt(0) || user?.username?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-start">
              <p className="truncate text-caption font-bold text-foreground">
                {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username}
              </p>
              <p className="truncate text-caption text-muted-foreground font-semibold">
                {user?.is_superuser ? "مدير النظام" : "مستخدم مصدق"}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={logout}
          title="تسجيل الخروج"
          aria-label="تسجيل الخروج"
          className={cn(
            "p-2 rounded-xl text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors flex items-center gap-1.5 font-bold text-caption shrink-0",
            collapsed && "w-10 h-10 justify-center p-0"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>خروج</span>}
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ className }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen shrink-0 bg-card text-foreground transition-all duration-300 z-20",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <SidebarContent
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
    </aside>
  );
}
