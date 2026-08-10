import { useState } from "react";

import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";

import { ThemeToggle } from "../theme/ThemeToggle";
import { Button } from "../ui/Button";
import { MobileDrawer } from "./MobileDrawer";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar className="hidden md:block" />
      <MobileDrawer open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <ThemeToggle />
          <UserMenu />
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
