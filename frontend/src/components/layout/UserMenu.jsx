import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, ShieldCheck } from "lucide-react";

import { useAuth } from "../../features/auth/AuthContext";

export function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
  const initial = user.first_name ? user.first_name.charAt(0) : user.username.charAt(0).toUpperCase();

  // Roles can be objects or IDs depending on me response schema.
  // In UserMenu.jsx: line 11 says `user.roles.map((r) => r.name_ar)`. So user.roles has populated role objects.
  const roleNames = user.roles?.map((r) => r.name_ar).join(" ، ") || "مستخدم مصدق";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center gap-2.5 rounded-full border border-border/80 bg-card p-1.5 pe-4 text-sm font-semibold outline-none hover:bg-secondary/60 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring transition-all">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-inner border border-border">
          {initial}
        </span>
        <span className="hidden sm:inline text-foreground text-xs font-bold leading-none">{displayName}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-56 rounded-xl border border-border/80 bg-card p-2 text-card-foreground shadow-xl animate-slide-up"
        >
          <div className="px-3 py-2">
            <p className="text-xs font-bold text-foreground">{displayName}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{user.email || "لا يوجد بريد مسجل"}</p>
            <div className="flex items-center gap-1.5 mt-2 bg-secondary/40 border border-border/50 px-2.5 py-1 rounded-md text-[10px] font-bold text-primary w-fit">
              <ShieldCheck className="h-3 w-3 shrink-0" />
              <span>{roleNames}</span>
            </div>
          </div>

          <DropdownMenu.Separator className="my-1.5 h-px bg-border/50" />

          <DropdownMenu.Item
            onSelect={logout}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive outline-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive font-medium transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            تسجيل الخروج
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
