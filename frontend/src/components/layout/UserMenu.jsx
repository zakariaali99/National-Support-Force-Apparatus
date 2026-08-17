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
      <DropdownMenuTrigger className="flex min-h-10 items-center gap-2.5 rounded-full border border-white/10 bg-white/5 p-1 pe-3 text-body-sm font-semibold outline-none transition-all hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#2B95E8] cursor-pointer">
        <Avatar name={displayName} size="sm" className="border-0 bg-[#2B95E8] text-white shadow-xs rounded-full" />
        <span className="hidden text-caption font-bold leading-none text-white sm:inline">
          {displayName}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="rounded-2xl shadow-xl border border-slate-200/80 dark:border-white/10 p-2">
        <DropdownMenuLabel>
          <p className="text-caption font-bold text-slate-900 dark:text-slate-100">{displayName}</p>
          <p className="mt-0.5 text-caption text-slate-500">{user.email || "لا يوجد بريد مسجل"}</p>
          <div className="mt-2 flex w-fit items-center gap-1.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-caption text-blue-700 dark:text-blue-300 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{roleNames}</span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onSelect={logout} className="rounded-xl">
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
