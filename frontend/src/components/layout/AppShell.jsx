import { useState } from "react";
import { Menu, Home, ChevronLeft, Search } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { ThemeToggle } from "../theme/ThemeToggle";
import { Button } from "../ui/Button";
import { ToastContainer } from "../ui/Toast";
import { CommandPalette } from "./CommandPalette";
import { MobileDrawer } from "./MobileDrawer";
import { NotificationBell } from "./NotificationBell";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";
import { NAV_INDEX } from "./navConfig";

function getBreadcrumbs(path) {
  if (path === "/") return [{ label: "لوحة التحكم", to: "/" }];

  const crumbs = [{ label: "الرئيسية", to: "/" }];
  const exact = NAV_INDEX[path];
  if (exact) {
    crumbs.push({ label: exact.label, to: exact.to });
    return crumbs;
  }

  // Member sub-routes (record pages) — parent from nav metadata, leaf derived.
  if (path.startsWith("/members")) {
    crumbs.push({ label: "الأفراد", to: "/members" });
    if (path.endsWith("/new")) crumbs.push({ label: "إضافة فرد جديد", to: path });
    else if (path.includes("/edit")) crumbs.push({ label: "تعديل بيانات الفرد", to: path });
    else crumbs.push({ label: "ملف الفرد", to: path });
  }
  return crumbs;
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <div className="flex min-h-screen bg-background text-foreground animate-fade-in">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:start-4 focus:top-4 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-body-sm focus:font-bold focus:text-primary-foreground"
      >
        تخطَّ إلى المحتوى الرئيسي
      </a>

      <Sidebar className="hidden md:block" />
      <MobileDrawer open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/10 bg-[#0d1527] text-white px-4 shadow-md backdrop-blur-md md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0 text-white hover:bg-white/10 rounded-xl"
            onClick={() => setMobileOpen(true)}
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumbs from nav metadata */}
          <nav
            aria-label="مسار التنقل"
            className="flex items-center gap-1.5 text-caption font-medium text-gray-300 overflow-x-auto whitespace-nowrap py-1"
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <div key={crumb.to + idx} className="flex items-center gap-1.5">
                  {idx > 0 && <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-gray-500" />}
                  {isLast ? (
                    <span className="text-white font-bold">{crumb.label}</span>
                  ) : (
                    <Link
                      to={crumb.to}
                      className="text-gray-300 hover:text-[#2B95E8] transition-colors flex items-center gap-1"
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

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="hidden sm:inline-flex items-center gap-2 text-gray-300 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl h-10 px-4 text-body-sm transition-all cursor-pointer shadow-xs"
              onClick={() => setPaletteOpen(true)}
              aria-label="فتح لوحة الأوامر (Ctrl+K / ⌘K)"
            >
              <Search className="h-4 w-4 text-gray-400" />
              <span>بحث...</span>
              <kbd className="ms-2 hidden rounded-lg border border-white/10 bg-white/5 px-1.5 py-0.5 text-caption font-semibold text-gray-300 lg:inline">
                Ctrl+K
              </kbd>
            </button>
            <NotificationBell />
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-slide-up space-y-6">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette (⌘K / Ctrl+K) */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      {/* Global Toast Notification Container */}
      <ToastContainer />
    </div>
  );
}
