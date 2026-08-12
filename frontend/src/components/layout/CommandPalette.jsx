import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Command } from "cmdk";
import { FileText, Search, Users } from "lucide-react";

import { useAuth } from "../../features/auth/AuthContext";
import { useMembers } from "../../features/members/api";
import { normalizeAr } from "../../lib/arabic";
import { cn } from "../../lib/utils";
import { Dialog, DialogContent } from "../ui/Dialog";
import { ALL_NAV_ITEMS } from "./navConfig";

/* ⌘K / Ctrl+K palette — page navigation + member search.
 *
 * Same Arabic-safe matching as Combobox: cmdk's default fuzzy scorer is useless
 * against Arabic (hamza-alef, etc.), so both sides pass through `normalizeAr`
 * and we do a plain substring test.
 *
 * Two result sections:
 *  - "الصفحات": every nav item the current user may open (permission-filtered
 *    via navConfig).
 *  - "الأعضاء": debounced server search through the existing useMembers hook —
 *    backend matches by name or force number via SearchFilter.
 */

export function CommandPalette({ open, onOpenChange }) {
  const [selfOpen, setSelfOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : selfOpen;
  const setOpen = onOpenChange ?? setSelfOpen;
  const [search, setSearch] = useState("");
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  // Debounce the member query the same way MemberList does.
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data } = useMembers(
    { search: debounced || undefined, page_size: 8 },
    { enabled: Boolean(debounced) }
  );
  const { data: byNumber } = useMembers(
    { force_number: debounced || undefined, page_size: 8 },
    { enabled: Boolean(debounced) }
  );

  // Global shortcut.
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  // Refocus the search field whenever the dialog opens.
  useEffect(() => {
    if (isOpen) setSearch("");
  }, [isOpen]);

  const pages = ALL_NAV_ITEMS
    .filter((item) => !item.permission || hasPermission(item.permission))
    .map((item) => ({
      ...item,
      group: item.breadcrumb,
    }));

  const members = [...(data?.results ?? []), ...(byNumber?.results ?? [])].filter(
    (member, index, all) => all.findIndex((m) => m.id === member.id) === index
  );

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent
        className="w-[min(92vw,36rem)] rounded-2xl border border-border bg-surface p-0 text-fg shadow-overlay"
        // Pull focus into the palette's own search field, not the close button.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          document.getElementById("command-palette-input")?.focus();
        }}
        onCloseAutoFocus={(event) => event.preventDefault()}
        aria-describedby={undefined}
      >
        <Command
          label="لوحة الأوامر"
          filter={(itemValue, _search, keywords) => {
            const needle = normalizeAr(search);
            if (!needle) return 1;
            return normalizeAr((keywords ?? []).join(" ")).includes(needle) ? 1 : 0;
          }}
          className="flex flex-col"
        >
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
            <Command.Input
              id="command-palette-input"
              value={search}
              onValueChange={setSearch}
              placeholder="ابحث عن صفحة أو فرد..."
              className="h-12 w-full min-w-0 bg-transparent text-body text-fg placeholder:text-fg-subtle focus-visible:-outline-offset-2"
            />
            <kbd className="hidden shrink-0 select-none rounded-control border border-border-strong bg-surface-raised px-2 py-1 text-caption font-bold text-fg-subtle sm:block">
              Esc
            </kbd>
          </div>

          <Command.List
            label="النتائج"
            className="max-h-96 overflow-y-auto overscroll-contain p-1.5"
          >
            <Command.Group heading="الصفحات" className="px-2 pt-2 text-caption font-bold text-fg-subtle">
              {pages.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.to}
                    value={item.to}
                    keywords={[item.label, item.group ?? ""]}
                    onSelect={() => {
                      navigate(item.to);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex min-h-10 cursor-pointer select-none items-center gap-3 rounded-control px-3 py-2 text-body text-fg coarse:min-h-11",
                      "data-[selected=true]:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-start">{item.label}</span>
                    {item.group && (
                      <span className="shrink-0 text-caption text-fg-subtle">{item.group}</span>
                    )}
                  </Command.Item>
                );
              })}
            </Command.Group>

            {members.length > 0 && (
              <Command.Group heading="الأفراد" className="px-2 pt-2 text-caption font-bold text-fg-subtle">
                {members.map((member) => (
                  <Command.Item
                    key={member.id}
                    value={`member-${member.id}`}
                    keywords={[member.full_name, member.force_number]}
                    onSelect={() => {
                      navigate(`/members/${member.id}`);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex min-h-10 cursor-pointer select-none items-center gap-3 rounded-control px-3 py-2 text-body text-fg coarse:min-h-11",
                      "data-[selected=true]:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]"
                    )}
                  >
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt=""
                        className="h-6 w-6 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="h-4.5 w-4.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-start">{member.full_name}</span>
                    {member.force_number && (
                      <span className="shrink-0 font-mono text-caption text-fg-subtle dir-ltr">
                        {member.force_number}
                      </span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Empty className="flex items-center gap-2 px-3 py-6 text-caption text-fg-subtle">
              <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
              لا توجد نتائج مطابقة
            </Command.Empty>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}