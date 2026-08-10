import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, User } from "lucide-react";

import { useAuth } from "../../features/auth/AuthContext";

export function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
  const roleNames = user.roles.map((r) => r.name_ar).join("، ") || "بدون دور";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </span>
        <span className="hidden sm:inline">{displayName}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-48 rounded-lg border border-border bg-card p-1 text-card-foreground shadow-lg"
        >
          <div className="px-2 py-1.5 text-xs text-muted-foreground">{roleNames}</div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={logout}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
