import { useState } from "react";
import { Pin, Trash2, CheckCircle2, Plus } from "lucide-react";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Select } from "../../components/ui/Select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs";
import { Textarea } from "../../components/ui/Textarea";
import { showToast } from "../../components/ui/Toast";
import { formatDate, formatDateTime, formatNumber } from "../../lib/format";
import { useAuth } from "../auth/AuthContext";
import {
  useAssignableUsers,
  useCreateMemberEvaluation,
  useCreateMemberNote,
  useCreateMemberTask,
  useCreateVacationRequest,
  useDecideVacationRequest,
  useDeleteMemberEvaluation,
  useDeleteMemberNote,
  useDeleteMemberTask,
  useMemberEvaluations,
  useMemberNotes,
  useMemberTasks,
  useUpdateMemberTask,
  useVacationRequests,
  useVacationTransactions,
} from "../workflow/api";

const TABS = [
  { key: "notes", label: "الملاحظات" },
  { key: "tasks", label: "المهام" },
  { key: "evaluations", label: "التقييمات" },
  { key: "vacation", label: "الإجازات" },
];

export function ProfileExtras({ member }) {
  return (
    <Card>
      <Tabs defaultValue="notes" className="w-full">
        <CardHeader className="pb-0 border-b border-border/50">
          <TabsList className="w-full justify-start">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </CardHeader>
        <CardContent className="p-6">
          <TabsContent value="notes">
            <NotesTab member={member} />
          </TabsContent>
          <TabsContent value="tasks">
            <TasksTab member={member} />
          </TabsContent>
          <TabsContent value="evaluations">
            <EvaluationsTab member={member} />
          </TabsContent>
          <TabsContent value="vacation">
            <VacationTab member={member} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

function EmptyState({ text }) {
  return <p className="text-xs text-muted-foreground text-center py-6">{text}</p>;
}

function NotesTab({ member }) {
  const { hasPermission } = useAuth();
  const { data: notes = [], isLoading } = useMemberNotes(member.id);
  const createNote = useCreateMemberNote();
  const deleteNote = useDeleteMemberNote(member.id);
  const [body, setBody] = useState("");
  const canEdit = hasPermission("member.edit");

  async function handleAdd(e) {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      await createNote.mutateAsync({ member: member.id, body });
      setBody("");
      showToast("تمت إضافة الملاحظة");
    } catch {
      showToast("تعذرت إضافة الملاحظة", "error");
    }
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="أضف ملاحظة جديدة..."
            className="min-h-16"
          />
          <Button type="submit" size="icon" disabled={createNote.isPending}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      )}
      {isLoading && <EmptyState text="جارِ التحميل..." />}
      {!isLoading && notes.length === 0 && <EmptyState text="لا توجد ملاحظات مسجلة." />}
      <div className="space-y-2.5">
        {notes.map((note) => (
          <div key={note.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-card/40">
            {note.is_pinned && <Pin className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground whitespace-pre-wrap">{note.body}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {note.author_name || "—"} • {formatDateTime(note.created_at)}
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => deleteNote.mutate(note.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const PRIORITY_LABELS = { low: "منخفضة", normal: "عادية", high: "عالية" };
const STATUS_LABELS = { open: "مفتوحة", in_progress: "قيد التنفيذ", done: "منجزة" };
const STATUS_VARIANTS = { open: "outline", in_progress: "warning", done: "success" };

function TasksTab({ member }) {
  const { hasPermission } = useAuth();
  const { data: tasks = [], isLoading } = useMemberTasks(member.id);
  const { data: users = [] } = useAssignableUsers();
  const createTask = useCreateMemberTask();
  const updateTask = useUpdateMemberTask(member.id);
  const deleteTask = useDeleteMemberTask(member.id);
  const canAssign = hasPermission("task.assign");

  const [form, setForm] = useState({ title: "", assigned_to: "", due_date: "", priority: "normal" });

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      await createTask.mutateAsync({
        member: member.id,
        title: form.title,
        assigned_to: form.assigned_to || null,
        due_date: form.due_date || null,
        priority: form.priority,
      });
      setForm({ title: "", assigned_to: "", due_date: "", priority: "normal" });
      showToast("تم إسناد المهمة");
    } catch {
      showToast("تعذر إنشاء المهمة", "error");
    }
  }

  return (
    <div className="space-y-4">
      {canAssign && (
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
          <div className="sm:col-span-2">
            <Label>عنوان المهمة</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <Label>إسناد إلى</Label>
            <Select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
              <option value="">— بدون —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2">
            <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            <Button type="submit" size="icon" disabled={createTask.isPending}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}
      {isLoading && <EmptyState text="جارِ التحميل..." />}
      {!isLoading && tasks.length === 0 && <EmptyState text="لا توجد مهام مسندة." />}
      <div className="space-y-2.5">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/40">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-foreground">{task.title}</p>
                <Badge variant={STATUS_VARIANTS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
                <Badge variant="outline">{PRIORITY_LABELS[task.priority]}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {task.assigned_to_name || "غير مسندة"} {task.due_date ? `• الاستحقاق: ${formatDate(task.due_date)}` : ""}
              </p>
            </div>
            {canAssign && task.status !== "done" && (
              <button
                type="button"
                onClick={() => updateTask.mutate({ id: task.id, status: "done" })}
                className="text-muted-foreground hover:text-success shrink-0"
                title="تعليم كمنجزة"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
            )}
            {canAssign && (
              <button
                type="button"
                onClick={() => deleteTask.mutate(task.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EvaluationsTab({ member }) {
  const { hasPermission } = useAuth();
  const { data: evaluations = [], isLoading } = useMemberEvaluations(member.id);
  const createEvaluation = useCreateMemberEvaluation();
  const deleteEvaluation = useDeleteMemberEvaluation(member.id);
  const canEdit = hasPermission("member.edit");
  const [form, setForm] = useState({ period_start: "", period_end: "", body: "", score: "" });

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.period_start || !form.period_end || !form.body.trim()) return;
    try {
      await createEvaluation.mutateAsync({
        member: member.id,
        period_start: form.period_start,
        period_end: form.period_end,
        body: form.body,
        score: form.score || null,
      });
      setForm({ period_start: "", period_end: "", body: "", score: "" });
      showToast("تم حفظ التقييم");
    } catch (err) {
      showToast(err?.response?.data?.non_field_errors?.[0] || "تعذر حفظ التقييم", "error");
    }
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <form onSubmit={handleAdd} className="space-y-2 p-3 rounded-xl border border-border/50 bg-card/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <Label>بداية الفترة</Label>
              <Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} required />
            </div>
            <div>
              <Label>نهاية الفترة</Label>
              <Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} required />
            </div>
            <div>
              <Label>الدرجة (اختياري)</Label>
              <Input type="number" step="0.1" min="0" max="10" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
            </div>
          </div>
          <Textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="نص التقييم..."
            required
          />
          <Button type="submit" size="sm" disabled={createEvaluation.isPending}>حفظ التقييم</Button>
        </form>
      )}
      {isLoading && <EmptyState text="جارِ التحميل..." />}
      {!isLoading && evaluations.length === 0 && <EmptyState text="لا توجد تقييمات مسجلة." />}
      <div className="space-y-2.5">
        {evaluations.map((ev) => (
          <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-card/40">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-foreground">
                  {formatDate(ev.period_start)} — {formatDate(ev.period_end)}
                </p>
                {ev.score != null && <Badge variant="info">{formatNumber(ev.score)}</Badge>}
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap mt-1">{ev.body}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5">{ev.evaluator_name || "—"}</p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => deleteEvaluation.mutate(ev.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const VACATION_STATUS_LABELS = { pending: "بانتظار الاعتماد", approved: "معتمدة", rejected: "مرفوضة" };
const VACATION_STATUS_VARIANTS = { pending: "warning", approved: "success", rejected: "destructive" };

function VacationTab({ member }) {
  const { hasPermission } = useAuth();
  const { data: requests = [], isLoading } = useVacationRequests(member.id);
  const { data: ledger = [] } = useVacationTransactions(member.id);
  const createRequest = useCreateVacationRequest();
  const decide = useDecideVacationRequest(member.id);
  const canEdit = hasPermission("member.edit");
  const canApprove = hasPermission("vacation.approve");
  const [form, setForm] = useState({ start_date: "", end_date: "", days: "", reason: "" });

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.start_date || !form.end_date || !form.days) return;
    try {
      await createRequest.mutateAsync({ member: member.id, ...form });
      setForm({ start_date: "", end_date: "", days: "", reason: "" });
      showToast("تم تقديم طلب الإجازة");
    } catch (err) {
      showToast(err?.response?.data?.non_field_errors?.[0] || "تعذر تقديم الطلب", "error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5">
        <span className="text-xs font-bold text-foreground">الرصيد الحالي</span>
        <span className="text-lg font-black text-primary">{formatNumber(member.vacation_balance_days)} يوم</span>
      </div>

      {canEdit && (
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end p-3 rounded-xl border border-border/50 bg-card/30">
          <div>
            <Label>من تاريخ</Label>
            <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
          </div>
          <div>
            <Label>إلى تاريخ</Label>
            <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
          </div>
          <div>
            <Label>عدد الأيام</Label>
            <Input type="number" step="0.5" min="0.5" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} required />
          </div>
          <Button type="submit" size="sm" disabled={createRequest.isPending}>تقديم الطلب</Button>
          <div className="sm:col-span-4">
            <Label>السبب (اختياري)</Label>
            <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
        </form>
      )}

      {isLoading && <EmptyState text="جارِ التحميل..." />}
      {!isLoading && requests.length === 0 && <EmptyState text="لا توجد طلبات إجازة." />}
      <div className="space-y-2.5">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/40">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-foreground">
                  {formatDate(r.start_date)} — {formatDate(r.end_date)} ({formatNumber(r.days)} يوم)
                </p>
                <Badge variant={VACATION_STATUS_VARIANTS[r.status]}>{VACATION_STATUS_LABELS[r.status]}</Badge>
              </div>
              {r.reason && <p className="text-xs text-muted-foreground mt-1">{r.reason}</p>}
            </div>
            {canApprove && r.status === "pending" && (
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: r.id, decision: "approve" })}>
                  اعتماد
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => decide.mutate({ id: r.id, decision: "reject" })}>
                  رفض
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {ledger.length > 0 && (
        <div>
          <p className="text-xs font-bold text-foreground mb-2">سجل حركة الرصيد</p>
          <div className="space-y-1.5">
            {ledger.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary/20">
                <span className="text-muted-foreground">{t.reason || t.kind} • {formatDateTime(t.created_at)}</span>
                <span className={`font-bold ${Number(t.days) < 0 ? "text-destructive" : "text-success"}`}>
                  {Number(t.days) > 0 ? "+" : ""}{formatNumber(t.days)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
