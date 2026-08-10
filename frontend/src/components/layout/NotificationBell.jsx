import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, CheckCheck } from "lucide-react";

import { Button } from "../ui/Button";
import { formatDateTime } from "../../lib/format";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../../features/workflow/api";

export function NotificationBell() {
  const { data: count = 0 } = useUnreadNotificationCount();
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const notifications = data?.results ?? [];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="الإشعارات">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 max-h-96 overflow-y-auto rounded-xl border border-border/80 bg-card p-2 text-card-foreground shadow-xl animate-slide-up"
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-xs font-bold text-foreground">الإشعارات</p>
            {count > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-[10px] font-bold text-primary hover:opacity-80"
              >
                <CheckCheck className="h-3 w-3" />
                تعليم الكل كمقروء
              </button>
            )}
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          {notifications.length === 0 && (
            <p className="p-4 text-center text-xs text-muted-foreground">لا توجد إشعارات</p>
          )}
          {notifications.map((n) => (
            <DropdownMenu.Item
              key={n.id}
              onSelect={() => !n.is_read && markRead.mutate(n.id)}
              className={`flex cursor-pointer flex-col gap-0.5 rounded-lg px-3 py-2 text-xs outline-none hover:bg-secondary/60 focus:bg-secondary/60 ${
                n.is_read ? "opacity-60" : "font-semibold"
              }`}
            >
              <span className="text-foreground">{n.message}</span>
              <span className="text-[10px] text-muted-foreground">{formatDateTime(n.created_at)}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
