import { useState } from "react";
import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import sealUrl from "../../assets/brand/nasf-seal.jpg";
import { cn } from "../../lib/utils";
import { NAV_ITEMS } from "./navConfig";
import { Tooltip } from "../ui/Tooltip";

export function SidebarContent({ onNavigate, collapsed = false, onToggleCollapse }) {
  const { user, hasPermission } = useAuth();
  const [openSections, setOpenSections] = useState({
    general: true,
    structure: true,
    settings: true,
  });

  const allowedItems = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  const groups = [
    {
      id: "general",
      title: "العامة",
      items: allowedItems.filter((i) => i.to === "/" || i.to.startsWith("/members")),
    },
    {
      id: "structure",
      title: "الهيكل التنظيمي",
      items: allowedItems.filter((i) => i.to.startsWith("/organization")),
    },
    {
      id: "settings",
      title: "الضبط والتهيئة",
      items: allowedItems.filter((i) => i.to.startsWith("/settings") || i.to === "/audit" || i.to === "/backups"),
    },
  ];

  function toggleSection(id) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="flex h-full flex-col bg-sidebar border-e border-sidebar-border shadow-sm transition-all duration-300">
      {/* Header Logo & Collapse Toggle */}
      <div className={cn("flex items-center justify-between border-b border-sidebar-border p-4 bg-secondary/20 transition-all", collapsed && "justify-center px-2")}>
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <img
            src={sealUrl}
            alt="شعار الجهاز الوطني للقوى المساندة"
            className="h-10 w-10 shrink-0 rounded-full object-cover shadow border border-border"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-tight text-foreground">الجهاز الوطني</p>
              <p className="truncate text-xs font-bold text-primary">للقوى المساندة</p>
            </div>
          )}
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={collapsed ? "توسيع القائمة" : "طَيّ القائمة"}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-4 overflow-y-auto p-3 scrollbar-thin">
        {groups.map(
          (group) =>
            group.items.length > 0 && (
              <div key={group.id} className="space-y-1">
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleSection(group.id)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-extrabold text-muted-foreground tracking-wider uppercase hover:text-foreground transition-colors"
                  >
                    <span>{group.title}</span>
                    {openSections[group.id] ? (
                      <ChevronUp className="h-3 w-3 shrink-0 opacity-60" />
                    ) : (
                      <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                    )}
                  </button>
                )}

                {(collapsed || openSections[group.id]) && (
                  <div className="space-y-1">
                    {group.items.map(({ to, label, icon: Icon, end }) => {
                      const linkContent = (
                        <NavLink
                          key={to}
                          to={to}
                          end={end}
                          onClick={onNavigate}
                          className={({ isActive }) =>
                            cn(
                              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                              collapsed && "justify-center px-2",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Icon className="h-4.5 w-4.5 shrink-0" />
                              {!collapsed && <span className="truncate">{label}</span>}
                              {isActive && (
                                <span className="absolute start-0 top-2 bottom-2 w-1 rounded-full bg-accent" />
                              )}
                            </>
                          )}
                        </NavLink>
                      );

                      if (collapsed) {
                        return (
                          <Tooltip key={to} label={label} side="left">
                            {linkContent}
                          </Tooltip>
                        );
                      }
                      return linkContent;
                    })}
                  </div>
                )}
              </div>
            )
        )}
      </nav>

      {/* Footer User Profile Summary */}
      <div className={cn("border-t border-sidebar-border p-3 bg-secondary/10 flex items-center gap-3", collapsed && "justify-center px-2")}>
        <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 border border-border shadow-inner">
          {user?.first_name?.charAt(0) || user?.username?.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-foreground">
              {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username}
            </p>
            <p className="truncate text-[10px] text-muted-foreground font-semibold">
              {user?.is_superuser ? "مدير النظام" : "مستخدم مصدق"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ className }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen shrink-0 bg-sidebar text-sidebar-foreground transition-all duration-300 z-20",
        collapsed ? "w-20" : "w-64",
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
