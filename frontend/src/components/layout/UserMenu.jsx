import { LogOut, ShieldCheck } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { Avatar } from "../ui/Avatar";
import { useAuth } from "../../features/auth/AuthContext";

export function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
  const roleNames = user.roles?.map((r) => r.name_ar).join(" ، ") || "مستخدم مصدق";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex min-h-11 items-center gap-2.5 rounded-full border border-border/80 bg-card p-1.5 pe-4 text-body font-semibold outline-none transition-colors hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar name={displayName} size="sm" className="border-0 bg-primary text-primary-foreground" />
        <span className="hidden text-caption font-bold leading-none text-foreground sm:inline">
          {displayName}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuLabel>
          <p className="text-caption font-bold text-foreground">{displayName}</p>
          <p className="mt-0.5 text-micro text-muted-foreground">{user.email || "لا يوجد بريد مسجل"}</p>
          <div className="mt-2 flex w-fit items-center gap-1.5 rounded-control border border-border/50 bg-secondary/40 px-2.5 py-1 text-micro text-primary">
            <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>{roleNames}</span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onSelect={logout}>
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
