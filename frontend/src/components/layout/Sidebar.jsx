import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  PanelLeftClose,
  PanelLeftOpen,
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

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || hasPermission(item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex h-full flex-col bg-[#0F172A] text-slate-200 border-e border-slate-800/80 shadow-2xl transition-all duration-300 select-none">
      {/* Brand Header */}
      <div
        className={cn(
          "flex items-center justify-between border-b border-slate-800/80 p-3.5 bg-slate-900/40",
          collapsed && "flex-col items-center gap-2 p-2.5"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={sealUrl}
              alt="شعار الجهاز"
              className="h-9 w-9 rounded-xl object-cover border border-slate-700 shadow-md ring-2 ring-[#2B95E8]/20"
            />
            <span className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0F172A]" />
          </div>
          {!collapsed && (
            <div className="min-w-0 text-start space-y-0.5">
              <p className="text-[13.5px] font-bold text-white leading-normal">
                الجهاز الوطني للقوى المساندة
              </p>
              <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1 leading-normal">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                منظومة الشؤون الإدارية
              </p>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-700/60 transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title={collapsed ? "توسيع القائمة الجانبية" : "طي القائمة"}
            aria-label={collapsed ? "توسيع القائمة الجانبية" : "طي القائمة"}
          >
            {collapsed ? (
              <PanelLeftClose className="h-4 w-4 text-[#38bdf8]" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600 py-3",
          collapsed ? "px-2 space-y-3 flex flex-col items-center" : "px-3 space-y-3.5"
        )}
      >
        {groups.map((group, gIdx) => {
          if (group.items.length === 0) return null;

          if (collapsed) {
            return (
              <div key={group.id} className="w-full flex flex-col items-center space-y-1.5">
                {gIdx > 0 && <div className="w-5 h-[1px] bg-slate-800 my-1" />}
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
                        "h-9 w-9 rounded-xl flex items-center justify-center transition-all shrink-0 relative group",
                        isActive
                          ? "bg-[#2B95E8] text-white shadow-md shadow-[#2B95E8]/30"
                          : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                    </NavLink>
                  );
                })}
              </div>
            );
          }

          return (
            <div key={group.id} className="space-y-1">
              {/* Section Header */}
              <p className="px-2.5 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-start leading-normal">
                {group.title}
              </p>

              {/* Items */}
              <div className="space-y-1">
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
                        "group flex items-center justify-between rounded-xl min-h-[2.35rem] py-1.5 px-3 text-[13px] font-medium transition-all duration-150 relative",
                        isActive
                          ? "bg-slate-800/90 text-white font-bold border border-slate-700 shadow-xs"
                          : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive ? "text-[#38bdf8]" : "text-slate-400 group-hover:text-slate-200"
                          )}
                        />
                        <span className="text-start leading-relaxed whitespace-nowrap">{label}</span>
                      </div>

                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shadow-sm shadow-[#38bdf8] shrink-0" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div
        className={cn(
          "border-t border-slate-800/80 p-3 bg-slate-900/40 flex items-center justify-between gap-2",
          collapsed && "flex-col justify-center p-2"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-tr from-[#2B95E8] to-[#38bdf8] text-white flex items-center justify-center font-bold text-caption shrink-0 shadow-sm">
            {user?.first_name?.charAt(0) || user?.username?.charAt(0).toUpperCase() || "م"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-start space-y-0.5">
              <p className="text-[12.5px] font-bold text-white leading-normal truncate">
                {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username}
              </p>
              <p className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1 leading-normal">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                {user?.is_superuser ? "مدير عام النظام" : "مستخدم إداري"}
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
            "p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center gap-1.5 font-bold text-[11.5px] shrink-0 cursor-pointer",
            collapsed && "w-8.5 h-8.5 justify-center p-0"
          )}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
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
        "sticky top-0 h-screen shrink-0 bg-[#0F172A] text-slate-200 border-e border-slate-800/80 transition-all duration-300 z-20",
        collapsed ? "w-16" : "w-68",
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
