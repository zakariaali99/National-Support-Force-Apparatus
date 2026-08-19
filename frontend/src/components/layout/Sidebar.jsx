import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronUp,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import sealUrl from "../../assets/brand/nasf-seal.jpg";
import { cn } from "../../lib/utils";
import { NAV_GROUPS } from "./navConfig";

export function SidebarContent({ onNavigate, collapsed = false, onToggleCollapse }) {
  const { user, hasPermission, logout } = useAuth();
  const location = useLocation();

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
    <div className="flex h-full flex-col bg-[#0d1527] text-white border-e border-white/10 shadow-2xl transition-all duration-300 select-none">
      {/* Brand Header */}
      <div
        className={cn(
          "flex items-center justify-between border-b border-white/10 p-3.5 bg-white/[0.03] backdrop-blur-md",
          collapsed && "flex-col items-center gap-2 p-2.5"
        )}
      >
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <div className="relative shrink-0">
            <img
              src={sealUrl}
              alt="شعار الجهاز الوطني"
              className="h-10 w-10 rounded-2xl object-cover border border-white/20 shadow-md ring-2 ring-[#2B95E8]/30"
            />
            <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0d1527]" />
          </div>
          {!collapsed && (
            <div className="min-w-0 text-start">
              <p className="truncate text-body-sm font-bold text-white tracking-tight">
                الجهاز الوطني للقوى المساندة
              </p>
              <p className="truncate text-micro font-semibold text-[#38bdf8] flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
                الوحدة القتالية الرابعة
              </p>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title={collapsed ? "فتح القائمة الجانبية" : "طي القائمة"}
          >
            {collapsed ? (
              <PanelLeftClose className="h-4 w-4 text-[#38bdf8]" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20",
          collapsed ? "p-2 space-y-3 flex flex-col items-center" : "p-3 space-y-2.5"
        )}
      >
        {groups.map((group) => {
          if (group.items.length === 0) return null;

          // Collapsed state
          if (collapsed) {
            return (
              <div key={group.id} className="space-y-1.5 w-full flex flex-col items-center">
                <div className="w-6 h-[1px] bg-white/10 my-1" />
                {group.items.map(({ to, label, icon: Icon, end }) => {
                  const isActive = end
                    ? location.pathname === to
                    : location.pathname.startsWith(to) && (to !== "/" || location.pathname === "/");
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      title={label}
                      aria-label={label}
                      onClick={onNavigate}
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all font-bold shrink-0 relative group",
                        isActive
                          ? "bg-[#2B95E8] text-white shadow-lg shadow-[#2B95E8]/30 ring-1 ring-white/30"
                          : "text-slate-400 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                    </NavLink>
                  );
                })}
              </div>
            );
          }

          // Expanded state
          const isOpen = openSections[group.id] ?? true;
          const isAnyItemActive = group.items.some((item) =>
            item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to) && (item.to !== "/" || location.pathname === "/")
          );

          return (
            <div key={group.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleSection(group.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-caption font-bold transition-all cursor-pointer",
                  isAnyItemActive
                    ? "text-[#38bdf8] bg-white/[0.04]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                )}
              >
                <span className="tracking-wide">{group.title}</span>
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-[#38bdf8]" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                )}
              </button>

              {isOpen && (
                <div className="space-y-0.5 pt-0.5 ps-1">
                  {group.items.map(({ to, label, icon: Icon, end }) => {
                    const isActive = end
                      ? location.pathname === to
                      : location.pathname.startsWith(to) && (to !== "/" || location.pathname === "/");

                    return (
                      <NavLink
                        key={to}
                        to={to}
                        end={end}
                        onClick={onNavigate}
                        className={cn(
                          "group flex items-center justify-between rounded-xl h-9.5 px-3 text-caption font-semibold transition-all duration-150 relative",
                          isActive
                            ? "bg-gradient-to-l from-[#2B95E8]/20 to-[#2B95E8]/10 text-white font-bold border border-[#2B95E8]/40 shadow-xs"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                              isActive ? "text-[#38bdf8]" : "text-slate-400 group-hover:text-white"
                            )}
                          />
                          <span className="truncate text-start">{label}</span>
                        </div>
                        {isActive && (
                          <span className="w-1.5 h-4 rounded-full bg-[#38bdf8] shadow-sm shadow-[#38bdf8]" />
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div
        className={cn(
          "border-t border-white/10 p-3 bg-white/[0.03] flex items-center justify-between gap-2",
          collapsed && "flex-col justify-center p-2"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#2B95E8] to-[#38bdf8] text-white flex items-center justify-center font-bold text-caption shrink-0 shadow-md">
            {user?.first_name?.charAt(0) || user?.username?.charAt(0).toUpperCase() || "م"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-start">
              <p className="truncate text-caption font-bold text-white">
                {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username}
              </p>
              <p className="truncate text-micro text-slate-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                {user?.is_superuser ? "مدير عام النظام" : "مستخدم إداري مصدق"}
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
            "p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center gap-1.5 font-bold text-caption shrink-0 cursor-pointer",
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
        "sticky top-0 h-screen shrink-0 bg-[#0d1527] text-white border-e border-white/10 transition-all duration-300 z-20",
        collapsed ? "w-18" : "w-72",
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

export default Sidebar;
