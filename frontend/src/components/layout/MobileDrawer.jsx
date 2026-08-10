import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { SidebarContent } from "./Sidebar";

export function MobileDrawer({ open, onOpenChange }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 md:hidden" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 start-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground shadow-xl md:hidden"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">القائمة الرئيسية</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="absolute end-3 top-3 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
          <SidebarContent onNavigate={() => onOpenChange(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
