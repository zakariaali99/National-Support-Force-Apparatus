import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Grid,
  List,
  HelpCircle,
  ArrowUpRight,
  FileSpreadsheet,
  Loader2,
  FileText,
  CheckSquare,
  Star,
  Printer,
  MoreHorizontal,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { AuthedImage } from "../../components/ui/AuthedImage";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Select } from "../../components/ui/Select";
import { Combobox } from "../../components/ui/Combobox";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { Pagination } from "../../components/ui/Pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/Dialog";
import { Textarea } from "../../components/ui/Textarea";
import { showToast } from "../../components/ui/Toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "../../components/ui/DropdownMenu";

import { useAuth } from "../auth/AuthContext";
import { factionsApi, ranksApi } from "../organization/api";
import { downloadAuthedFile } from "../reports/api";
import { useMembers, useUpdateMember } from "./api";
import { PrintDialog } from "./PrintDialog";
import { SERVICE_STATUS_OPTIONS, serviceStatusLabel } from "./constants";
import { useAssignableUsers, useCreateMemberEvaluation, useCreateMemberNote, useCreateMemberTask } from "../workflow/api";

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function MemberList() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("member.create");
  const canEdit = hasPermission("member.edit");
  const canExport = hasPermission("member.export");
  const canAssign = hasPermission("task.assign");

  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [faction, setFaction] = useState("");
  const [rank, setRank] = useState("");
  const [serviceStatus, setServiceStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState("list"); // "list" | "grid"

  // Quick procedure modals state
  const [activeProcedure, setActiveProcedure] = useState(null); // { type: 'note'|'task'|'eval'|'print', member: member }

  const debouncedSearch = useDebouncedValue(search);
  useEffect(() => setPage(1), [debouncedSearch, faction, rank, serviceStatus, pageSize]);

  const { data: ranks = [] } = ranksApi.useList({ ordering: "order" });
  const { data: factions = [] } = factionsApi.useList({ ordering: "name_ar" });
  const updateMember = useUpdateMember();

  const { data, isLoading } = useMembers({
    search: debouncedSearch || undefined,
    faction: faction || undefined,
    rank: rank || undefined,
    service_status: serviceStatus || undefined,
    page,
    page_size: pageSize,
  });

  const members = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  function getStatusVariant(status) {
    switch (status) {
      case "active":
        return "success";
      case "suspended":
        return "destructive";
      case "on_leave":
        return "warning";
      case "retired":
        return "secondary";
      default:
        return "outline";
    }
  }

  const activeFiltersCount = [faction, rank, serviceStatus].filter(Boolean).length + (search ? 1 : 0);

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (faction) params.set("faction", faction);
      if (rank) params.set("rank", rank);
      if (serviceStatus) params.set("service_status", serviceStatus);
      await downloadAuthedFile(`members/export/?${params.toString()}`, "members.xlsx");
    } catch {
      showToast("تعذر تصدير البيانات", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleQuickStatusChange(member, newStatus) {
    try {
      await updateMember.mutateAsync({ id: member.id, service_status: newStatus });
      showToast(`تم تغيير حالة العضو ${member.full_name} إلى (${serviceStatusLabel(newStatus)})`);
    } catch {
      showToast("تعذر تحديث حالة العضو", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">سجل أعضاء القوة</h1>
          <p className="text-xs text-muted-foreground font-medium mt-1">
            إدارة وعرض ملفات أعضاء الجهاز الوطني بالقوة المساندة مع تنفيذ الإجراءات السريعة والبحث المتقدم.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:self-center shrink-0">
          {canExport && (
            <Button variant="outline" size="sm" disabled={exporting} onClick={handleExport} className="shadow-sm">
              {exporting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="me-2 h-4 w-4 text-emerald-600" />}
              تصدير Excel
            </Button>
          )}
          {canCreate && (
            <Button asChild size="sm" className="shadow-md">
              <Link to="/members/new">
                <Plus className="me-1.5 h-4 w-4" />
                إضافة عضو جديد
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filter and View Selector Controls */}
      <Card className="shadow-sm border-border/80 bg-card">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم الكامل، الرقم الحربي، أو الرقم الوطني..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>

            {/* View Mode Toggles */}
            <div className="flex items-center gap-2 self-end">
              {activeFiltersCount > 0 && (
                <Badge variant="info" className="text-micro py-1">
                  مصفاة نشطة: {activeFiltersCount}
                </Badge>
              )}
              <div className="flex rounded-xl border border-border p-1 bg-secondary/30">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    viewMode === "list"
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="عرض جدول"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    viewMode === "grid"
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="عرض شبكي"
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Combobox & Dropdown Filters */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-micro font-bold text-muted-foreground">الفصيل (الإدارة)</Label>
              <Combobox
                options={factions.map((f) => ({ value: String(f.id), label: f.name_ar }))}
                value={faction}
                onChange={setFaction}
                placeholder="كل الفصائل"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-micro font-bold text-muted-foreground">الرتبة العسكرية</Label>
              <Combobox
                options={ranks.map((r) => ({ value: String(r.id), label: r.name_ar }))}
                value={rank}
                onChange={setRank}
                placeholder="كل الرتب"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-micro font-bold text-muted-foreground">الحالة العسكرية</Label>
              <Select value={serviceStatus} onChange={(e) => setServiceStatus(e.target.value)}>
                <option value="">كل الحالات</option>
                {SERVICE_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid or Table Members Presentation */}
      {isLoading ? (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-6 space-y-4 shadow-sm">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/80 rounded-2xl bg-card space-y-3 animate-fade-in shadow-xs">
          <HelpCircle className="h-12 w-12 text-muted-foreground/45" />
          <h3 className="font-bold text-base text-foreground">لا يوجد نتائج تطابق معايير البحث</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            يرجى التأكد من كلمة البحث أو إلغاء تحديد بعض الفلاتر لإظهار الأعضاء.
          </p>
        </div>
      ) : viewMode === "list" ? (
        <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm scrollbar-thin">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-secondary/60 text-foreground border-b border-border/80 sticky top-0 backdrop-blur-md">
              <tr>
                <th className="w-12 px-3 py-3.5 text-center text-xs font-bold text-muted-foreground">#</th>
                <th className="px-4 py-3.5 text-start font-bold text-xs text-muted-foreground tracking-wider uppercase">
                  الاسم الكامل
                </th>
                <th className="px-4 py-3.5 text-start font-bold text-xs text-muted-foreground tracking-wider uppercase">
                  الرقم الحربي
                </th>
                <th className="px-4 py-3.5 text-start font-bold text-xs text-muted-foreground tracking-wider uppercase">
                  الرقم الوطني
                </th>
                <th className="px-4 py-3.5 text-start font-bold text-xs text-muted-foreground tracking-wider uppercase">
                  الرتبة العسكرية
                </th>
                <th className="px-4 py-3.5 text-start font-bold text-xs text-muted-foreground tracking-wider uppercase">
                  الفصيل (الإدارة)
                </th>
                <th className="px-4 py-3.5 text-start font-bold text-xs text-muted-foreground tracking-wider uppercase">
                  الحالة
                </th>
                <th className="px-4 py-3.5 text-end font-bold text-xs text-muted-foreground tracking-wider uppercase">
                  الإجراءات السريعة
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-card">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-secondary/40 transition-colors group">
                  <td className="px-3 py-3 text-center align-middle">
                    <AuthedImage
                      src={member.photo_thumb_url}
                      alt={member.full_name}
                      className="h-10 w-10 rounded-full border border-border object-cover mx-auto shadow-xs"
                    />
                  </td>
                  <td className="px-4 py-3 text-start align-middle">
                    <Link
                      to={`/members/${member.id}`}
                      className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <span>{member.full_name}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-start align-middle font-mono font-bold text-foreground text-xs dir-ltr">
                    {member.force_number}
                  </td>
                  <td className="px-4 py-3 text-start align-middle font-mono text-muted-foreground text-xs dir-ltr">
                    {member.national_number || "—"}
                  </td>
                  <td className="px-4 py-3 text-start align-middle font-semibold text-foreground text-xs">
                    {member.rank_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-start align-middle font-medium text-muted-foreground text-xs">
                    {member.faction_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-start align-middle">
                    {canEdit ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="outline-none">
                          <Badge variant={getStatusVariant(member.service_status)} pulse={member.service_status === "active"} className="cursor-pointer hover:opacity-80">
                            {serviceStatusLabel(member.service_status)}
                          </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel className="text-micro font-bold">تعديل الحالة العسكرية</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {SERVICE_STATUS_OPTIONS.map((opt) => (
                            <DropdownMenuItem
                              key={opt.value}
                              onSelect={() => handleQuickStatusChange(member, opt.value)}
                              className={cn(member.service_status === opt.value && "font-bold text-primary")}
                            >
                              {opt.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge variant={getStatusVariant(member.service_status)} pulse={member.service_status === "active"}>
                        {serviceStatusLabel(member.service_status)}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end align-middle">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                        title="إضافة ملاحظة"
                        onClick={() => setActiveProcedure({ type: "note", member })}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      {canAssign && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                          title="إسناد مهمة"
                          onClick={() => setActiveProcedure({ type: "task", member })}
                        >
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                        title="إضافة تقييم"
                        onClick={() => setActiveProcedure({ type: "eval", member })}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                        title="طباعة الملف"
                        onClick={() => setActiveProcedure({ type: "print", member })}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button asChild variant="outline" size="sm" className="ms-1 h-8 rounded-lg">
                        <Link to={`/members/${member.id}`}>الملف الكامل</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-slide-up">
          {members.map((member) => (
            <Card key={member.id} className="group hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden relative">
              <CardContent className="p-6 space-y-4 flex-1">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="relative">
                    <AuthedImage
                      src={member.photo_thumb_url}
                      alt={member.full_name}
                      className="h-16 w-16 rounded-full border-2 border-border shadow object-cover"
                    />
                    <span className="absolute bottom-0 end-0 transform translate-y-0.5">
                      <Badge variant={getStatusVariant(member.service_status)} pulse={member.service_status === "active"} className="px-1.5 py-0" />
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {member.full_name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-semibold">{member.rank_name || "—"}</p>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الرقم الحربي:</span>
                    <span className="font-bold font-mono dir-ltr">{member.force_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الفصيل:</span>
                    <span className="font-semibold text-foreground">{member.faction_name || "—"}</span>
                  </div>
                </div>
              </CardContent>
              <div className="bg-secondary/20 border-t border-border/50 p-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setActiveProcedure({ type: "print", member })}
                >
                  <Printer className="h-3.5 w-3.5 me-1" />
                  طباعة
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link to={`/members/${member.id}`}>عرض الملف</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Universal Pagination */}
      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Inline Quick Modals */}
      {activeProcedure?.type === "note" && (
        <QuickNoteModal member={activeProcedure.member} onClose={() => setActiveProcedure(null)} />
      )}
      {activeProcedure?.type === "task" && (
        <QuickTaskModal member={activeProcedure.member} onClose={() => setActiveProcedure(null)} />
      )}
      {activeProcedure?.type === "eval" && (
        <QuickEvalModal member={activeProcedure.member} onClose={() => setActiveProcedure(null)} />
      )}
      {activeProcedure?.type === "print" && (
        <PrintDialog member={activeProcedure.member} />
      )}
    </div>
  );
}

function QuickNoteModal({ member, onClose }) {
  const [body, setBody] = useState("");
  const createNote = useCreateMemberNote();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      await createNote.mutateAsync({ member: member.id, body });
      showToast(`تم إضافة ملاحظة للعضو ${member.full_name}`);
      onClose();
    } catch {
      showToast("تعذر إضافة الملاحظة", "error");
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة ملاحظة سريعة — {member.full_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب الملاحظة هنا..."
            required
            className="min-h-24"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={createNote.isPending}>
              حفظ الملاحظة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function QuickTaskModal({ member, onClose }) {
  const { data: users = [] } = useAssignableUsers();
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const createTask = useCreateMemberTask();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createTask.mutateAsync({
        member: member.id,
        title,
        assigned_to: assignedTo || null,
        due_date: dueDate || null,
      });
      showToast(`تم إسناد المهمة للعضو ${member.full_name}`);
      onClose();
    } catch {
      showToast("تعذر إسناد المهمة", "error");
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إسناد مهمة جديدة — {member.full_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>عنوان المهمة</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>إسناد إلى</Label>
            <Select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">— بدون إسناد —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>تاريخ الاستحقاق</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              حفظ المهمة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function QuickEvalModal({ member, onClose }) {
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [score, setScore] = useState("");
  const [body, setBody] = useState("");
  const createEval = useCreateMemberEvaluation();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!periodStart || !periodEnd || !body.trim()) return;
    try {
      await createEval.mutateAsync({
        member: member.id,
        period_start: periodStart,
        period_end: periodEnd,
        score: score || null,
        body,
      });
      showToast(`تم إضاف التقييم للعضو ${member.full_name}`);
      onClose();
    } catch {
      showToast("تعذر إضافة التقييم", "error");
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة تقييم/مراجعة — {member.full_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>من تاريخ</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>إلى تاريخ</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label>الدرجة (من 10)</Label>
            <Input type="number" step="0.1" min="0" max="10" value={score} onChange={(e) => setScore(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>تقرير التقييم</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="نص التقييم والملاحظات..." required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={createEval.isPending}>
              حفظ التقييم
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
