import { useState } from "react";
import { Menu, Home, ChevronLeft } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { ThemeToggle } from "../theme/ThemeToggle";
import { Button } from "../ui/Button";
import { ToastContainer } from "../ui/Toast";
import { MobileDrawer } from "./MobileDrawer";
import { NotificationBell } from "./NotificationBell";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Helper to derive breadcrumb names in Arabic based on pathname
  function getBreadcrumbs() {
    const path = location.pathname;
    const parts = [{ label: "الرئيسية", to: "/" }];

    if (path.startsWith("/members")) {
      parts.push({ label: "الأعضاء", to: "/members" });
      if (path.endsWith("/new")) {
        parts.push({ label: "إضافة عضو جديد", to: path });
      } else if (path.endsWith("/approvals")) {
        parts.push({ label: "طلبات الاعتماد", to: path });
      } else if (path.includes("/edit")) {
        parts.push({ label: "تعديل بيانات العضو", to: path });
      } else if (path !== "/members") {
        parts.push({ label: "ملف العضو", to: path });
      }
    } else if (path.startsWith("/organization")) {
      parts.push({ label: "الهيكل التنظيمي", to: "#" });
      if (path.endsWith("/ranks")) {
        parts.push({ label: "الرتب", to: "/organization/ranks" });
      } else if (path.endsWith("/factions")) {
        parts.push({ label: "الفصائل (الإدارات)", to: "/organization/factions" });
      }
    } else if (path.startsWith("/settings")) {
      parts.push({ label: "الإعدادات", to: "#" });
      if (path.endsWith("/field-requirements")) {
        parts.push({ label: "متطلبات الحقول", to: "/settings/field-requirements" });
      } else if (path.endsWith("/roles")) {
        parts.push({ label: "الأدوار والصلاحيات", to: "/settings/roles" });
      } else if (path.endsWith("/users")) {
        parts.push({ label: "مستخدمو النظام", to: "/settings/users" });
      }
    } else if (path === "/audit") {
      parts.push({ label: "سجل التدقيق", to: path });
    } else if (path === "/backups") {
      parts.push({ label: "النسخ الاحتياطية", to: path });
    } else if (path === "/") {
      parts[0] = { label: "لوحة التحكم", to: "/" };
    }

    return parts;
  }

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex min-h-screen bg-background text-foreground animate-fade-in">
      <Sidebar className="hidden md:block" />
      <MobileDrawer open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/60 bg-card/90 backdrop-blur-md px-4 shadow-sm md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumbs for premium navigation */}
          <nav className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground overflow-x-auto whitespace-nowrap py-1">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <div key={crumb.to + idx} className="flex items-center gap-1.5">
                  {idx > 0 && <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
                  {isLast ? (
                    <span className="text-foreground font-bold">{crumb.label}</span>
                  ) : (
                    <Link
                      to={crumb.to}
                      className="hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      {crumb.to === "/" && <Home className="h-3.5 w-3.5 shrink-0" />}
                      <span>{crumb.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto animate-slide-up">
          <Outlet />
        </main>
      </div>

      {/* Global Toast Notification Container */}
      <ToastContainer />
    </div>
  );
}
