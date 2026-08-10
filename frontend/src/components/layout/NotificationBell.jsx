import { Bell, CheckCheck } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { Button } from "../ui/Button";
import { formatDateTime, formatNumber } from "../../lib/format";
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={count > 0 ? `الإشعارات، ${formatNumber(count)} غير مقروءة` : "الإشعارات"}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {count > 0 && (
            <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-micro text-destructive-foreground">
              {/* formatNumber keeps this Latin-numeral like the rest of the UI */}
              {count > 9 ? "9+" : formatNumber(count)}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="max-h-96 w-80 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-caption font-bold text-foreground">الإشعارات</span>
          {count > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1 rounded-control text-micro text-primary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CheckCheck className="h-3 w-3" aria-hidden="true" />
              تعليم الكل كمقروء
            </button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {notifications.length === 0 && (
          <p className="p-4 text-center text-caption text-muted-foreground">لا توجد إشعارات</p>
        )}

        {notifications.map((n) => (
          <DropdownMenuItem
            key={n.id}
            onSelect={() => !n.is_read && markRead.mutate(n.id)}
            className={`flex-col items-start gap-0.5 ${n.is_read ? "opacity-60" : "font-semibold"}`}
          >
            <span className="text-caption text-foreground">{n.message}</span>
            <span className="text-micro font-normal text-muted-foreground">
              {formatDateTime(n.created_at)}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
