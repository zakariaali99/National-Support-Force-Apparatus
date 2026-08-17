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
    <div className="flex h-full flex-col bg-[#1A2038] text-white border-e border-white/10 shadow-2xl transition-all duration-300">
      {/* Header Logo & Collapse Toggle Button */}
      <div
        className={cn(
          "flex items-center justify-between border-b border-white/10 p-3.5 bg-white/5",
          collapsed && "flex-col items-center gap-2 p-2"
        )}
      >
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <img
            src={sealUrl}
            alt="شعار الجهاز الوطني"
            className="h-10 w-10 shrink-0 rounded-2xl object-cover border border-white/20 shadow-md"
          />
          {!collapsed && (
            <div className="min-w-0 text-start">
              <p className="truncate text-label font-bold text-white tracking-tight">الجهاز الوطني للقوى المساندة</p>
              <p className="truncate text-caption text-[#2B95E8] font-semibold">الوحدة القتالية الرابعة</p>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-2 rounded-2xl text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title={collapsed ? "فتح القائمة" : "طي القائمة"}
          >
            {collapsed ? <PanelLeftClose className="h-4.5 w-4.5 text-[#2B95E8]" /> : <PanelLeftOpen className="h-4.5 w-4.5" />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className={cn("flex-1 overflow-y-auto scrollbar-thin", collapsed ? "p-2 space-y-3 flex flex-col items-center" : "p-3 space-y-3")}>
        {groups.map((group) => {
          if (group.items.length === 0) return null;

          // When collapsed, render centered icon buttons
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
                        "h-11 w-11 rounded-2xl flex items-center justify-center transition-all font-bold shrink-0 mx-auto",
                        isActive
                          ? "bg-white/10 text-[#2B95E8] shadow-md border border-white/10"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      )
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                  </NavLink>
                ))}
              </div>
            );
          }

          // When expanded, render section header + 2xl rounded items
          const isOpen = openSections[group.id] ?? true;
          return (
            <div key={group.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleSection(group.id)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-caption font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <span>{group.title}</span>
                {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-[#2B95E8]" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-500" />}
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
                          "flex items-center gap-3 rounded-2xl h-11 px-3.5 text-body-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-white/10 text-[#2B95E8] font-bold shadow-sm border border-white/10"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        )
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />
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
          "border-t border-white/10 p-3 bg-white/5 flex items-center justify-between gap-2",
          collapsed && "flex-col justify-center p-2"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-2xl bg-[#2B95E8] text-white flex items-center justify-center font-bold text-caption shrink-0 shadow-md">
            {user?.first_name?.charAt(0) || user?.username?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-start">
              <p className="truncate text-caption font-bold text-white">
                {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username}
              </p>
              <p className="truncate text-caption text-gray-400 font-medium">
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
            "p-2 rounded-2xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center gap-1.5 font-bold text-caption shrink-0 cursor-pointer",
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
        "sticky top-0 h-screen shrink-0 bg-[#1A2038] text-white border-e border-white/10 transition-all duration-300 z-20",
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
