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
    <div className="flex h-full flex-col bg-surface border-e border-slate-200/80 dark:border-slate-800 shadow-xs transition-all duration-300">
      {/* Header Logo & Collapse Toggle Button */}
      <div
        className={cn(
          "flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/70 dark:bg-slate-800/40",
          collapsed && "flex-col items-center gap-2 p-2"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
          <img
            src={sealUrl}
            alt="شعار الجهاز الوطني"
            className="h-9 w-9 shrink-0 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
          />
          {!collapsed && (
            <div className="min-w-0 text-start">
              <p className="truncate text-label font-bold text-slate-900 dark:text-slate-100">الجهاز الوطني للقوى المساندة</p>
              <p className="truncate text-caption text-blue-700 dark:text-blue-400 font-bold">الوحدة القتالية الرابعة</p>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-xl text-slate-700 dark:text-slate-300 bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title={collapsed ? "فتح القائمة" : "طي القائمة"}
          >
            {collapsed ? <PanelLeftClose className="h-4.5 w-4.5 text-blue-600" /> : <PanelLeftOpen className="h-4.5 w-4.5 text-slate-500" />}
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
              <div key={group.id} className="space-y-1.5 w-full flex flex-col items-center">
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
                          ? "bg-blue-700 text-white border-blue-700 shadow-xs"
                          : "bg-surface text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-700 border-slate-200 dark:border-slate-700"
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
                className="w-full flex items-center justify-between px-2.5 py-1 text-caption font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <span>{group.title}</span>
                {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-blue-600" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </button>

              {isOpen && (
                <div className="space-y-0.5 pt-0.5">
                  {group.items.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2.5 rounded-lg h-9 px-2.5 text-body-sm font-semibold transition-all",
                          isActive
                            ? "bg-blue-700 text-white shadow-xs font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                        )
                      }
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
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
          "border-t border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between gap-2",
          collapsed && "flex-col justify-center p-2"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8.5 w-8.5 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-caption shrink-0 shadow-xs">
            {user?.first_name?.charAt(0) || user?.username?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-start">
              <p className="truncate text-caption font-bold text-slate-900 dark:text-slate-100">
                {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username}
              </p>
              <p className="truncate text-caption text-slate-500 font-medium">
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
            "p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 transition-colors flex items-center gap-1.5 font-bold text-caption shrink-0 cursor-pointer",
            collapsed && "w-9 h-9 justify-center p-0"
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
        "sticky top-0 h-screen shrink-0 bg-surface border-e border-slate-200/80 dark:border-slate-800 transition-all duration-300 z-20",
        collapsed ? "w-16" : "w-72",
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
