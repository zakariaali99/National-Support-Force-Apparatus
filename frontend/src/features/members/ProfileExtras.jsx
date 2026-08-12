import { useState } from "react";
import { CheckCircle2, FileText, Pin, Plus, Trash2, Calendar, Award, CheckSquare, Palmtree, ArrowRightLeft, FileCheck, Upload } from "lucide-react";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/Dialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Select } from "../../components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/Tabs";
import { Textarea } from "../../components/ui/Textarea";
import { showToast } from "../../components/ui/Toast";
import { createResourceHooks } from "../../lib/createResourceHooks";
import { formatDate, formatDateTime, formatNumber } from "../../lib/format";
import { useAuth } from "../auth/AuthContext";
import { useCreateMemberPledge, useUploadMemberDocument } from "./api";
import {
  useAssignableUsers,
  useCreateMemberEvaluation,
  useCreateMemberNote,
  useCreateMemberTask,
  useCreateVacationRequest,
  useCreateVacationTransaction,
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

const documentTypesApi = createResourceHooks("document-types", "document-types/");

const TABS = [
  { key: "notes", label: "الملاحظات" },
  { key: "tasks", label: "المهام" },
  { key: "evaluations", label: "التقييمات" },
  { key: "vacation", label: "الإجازات والرصيد" },
];

export function ProfileExtras({ member }) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("member.edit");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Top Action Row for Career Record */}
      {canEdit && (
        <div className="flex items-center justify-between p-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-body font-bold text-foreground">إضافة إجراء وظيفي جديد</h4>
              <p className="text-caption text-muted-foreground">أضف ملاحظة، مهمة مسندة، تقييم أداء، أو إجازة ورصيد لسجل الفرد.</p>
            </div>
          </div>
          <Button onClick={() => setModalOpen(true)} className="shadow-xs font-bold">
            <Plus className="h-4 w-4 me-1.5" />
            إضافة إجراء بالسجل
          </Button>
        </div>
      )}

      {/* Main Career Record Tabs Card */}
      <Card className="border border-border/80 shadow-sm">
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

      {/* Unified Career Action Modal */}
      <CareerActionModal member={member} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

function LoadingLine() {
  return <p className="text-caption text-muted-foreground text-center py-6">جارِ التحميل...</p>;
}

/* -------------------------------------------------------------------------- */
/* UNIFIED CAREER ACTION MODAL                                                */
/* -------------------------------------------------------------------------- */

function CareerActionModal({ member, open, onOpenChange }) {
  const [actionType, setActionType] = useState("note");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,54rem)] max-h-[88vh] overflow-y-auto rounded-2xl border border-border/80 shadow-md p-6 space-y-4">
        <DialogHeader className="pb-2 border-b border-border/60 text-start">
          <DialogTitle className="text-section font-bold text-foreground">إضافة إجراء / حدث بالسجل الوظيفي</DialogTitle>
        </DialogHeader>

        {/* Action Type Selector - Spacious 6 Column Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 py-1">
          <button
            type="button"
            onClick={() => setActionType("note")}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              actionType === "note"
                ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                : "bg-card text-foreground hover:bg-secondary border-border/80"
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-caption font-bold">ملاحظة</span>
          </button>

          <button
            type="button"
            onClick={() => setActionType("task")}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              actionType === "task"
                ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                : "bg-card text-foreground hover:bg-secondary border-border/80"
            }`}
          >
            <CheckSquare className="h-5 w-5" />
            <span className="text-caption font-bold">مهمة</span>
          </button>

          <button
            type="button"
            onClick={() => setActionType("eval")}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              actionType === "eval"
                ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                : "bg-card text-foreground hover:bg-secondary border-border/80"
            }`}
          >
            <Award className="h-5 w-5" />
            <span className="text-caption font-bold">تقييم</span>
          </button>

          <button
            type="button"
            onClick={() => setActionType("vacation")}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              actionType === "vacation"
                ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                : "bg-card text-foreground hover:bg-secondary border-border/80"
            }`}
          >
            <Palmtree className="h-5 w-5" />
            <span className="text-caption font-bold">إجازة</span>
          </button>

          <button
            type="button"
            onClick={() => setActionType("pledge")}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              actionType === "pledge"
                ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                : "bg-card text-foreground hover:bg-secondary border-border/80"
            }`}
          >
            <FileCheck className="h-5 w-5" />
            <span className="text-caption font-bold">تعهد</span>
          </button>

          <button
            type="button"
            onClick={() => setActionType("document")}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              actionType === "document"
                ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                : "bg-card text-foreground hover:bg-secondary border-border/80"
            }`}
          >
            <Upload className="h-5 w-5" />
            <span className="text-caption font-bold">مستند</span>
          </button>
        </div>

        {/* Modal Forms */}
        <div className="pt-2">
          {actionType === "note" && <ModalNoteForm member={member} onSuccess={() => onOpenChange(false)} />}
          {actionType === "task" && <ModalTaskForm member={member} onSuccess={() => onOpenChange(false)} />}
          {actionType === "eval" && <ModalEvalForm member={member} onSuccess={() => onOpenChange(false)} />}
          {actionType === "vacation" && <ModalVacationForm member={member} onSuccess={() => onOpenChange(false)} />}
          {actionType === "pledge" && <ModalPledgeForm member={member} onSuccess={() => onOpenChange(false)} />}
          {actionType === "document" && <ModalDocumentForm member={member} onSuccess={() => onOpenChange(false)} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModalNoteForm({ member, onSuccess }) {
  const createNote = useCreateMemberNote();
  const [body, setBody] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      await createNote.mutateAsync({ member: member.id, body });
      showToast("تمت إضافة الملاحظة بالسجل");
      onSuccess();
    } catch {
      showToast("تعذرت إضافة الملاحظة", "error");
    }
  }

  return (
    <form onSubmit={handleAdd} className="space-y-4">
      <div className="space-y-1.5">
        <Label required>نص الملاحظة الإدارية</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="اكتب الملاحظة أو البيان المطلوب تسجيله..."
          className="min-h-28"
          required
        />
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
        <Button type="submit" disabled={createNote.isPending}>
          حفظ الملاحظة
        </Button>
      </div>
    </form>
  );
}

function ModalTaskForm({ member, onSuccess }) {
  const { data: users = [] } = useAssignableUsers();
  const createTask = useCreateMemberTask();
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
      showToast("تم إسناد المهمة بالسجل");
      onSuccess();
    } catch {
      showToast("تعذر إنشاء المهمة", "error");
    }
  }

  return (
    <form onSubmit={handleAdd} className="space-y-4">
      <div className="space-y-1.5">
        <Label required>عنوان المهمة</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: استكمال الفحص الطبي، تقديم مستند..." required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>إسناد إلى</Label>
          <Select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
            <option value="">— بدون —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>تاريخ الاستحقاق</Label>
          <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>الأولوية</Label>
        <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option value="low">منخفضة</option>
          <option value="normal">عادية</option>
          <option value="high">عالية</option>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
        <Button type="submit" disabled={createTask.isPending}>
          إسناد المهمة
        </Button>
      </div>
    </form>
  );
}

function ModalEvalForm({ member, onSuccess }) {
  const createEvaluation = useCreateMemberEvaluation();
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
      showToast("تم حفظ التقييم بالسجل");
      onSuccess();
    } catch (err) {
      showToast(err?.response?.data?.non_field_errors?.[0] || "تعذر حفظ التقييم", "error");
    }
  }

  return (
    <form onSubmit={handleAdd} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label required>بداية الفترة</Label>
          <Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label required>نهاية الفترة</Label>
          <Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>الدرجة (من 10)</Label>
          <Input type="number" step="0.1" min="0" max="10" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label required>تفاصيل وملاحظات التقييم</Label>
        <Textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          placeholder="ملاحظات تقييم الأداء والسلوك والانضباط..."
          className="min-h-24"
          required
        />
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
        <Button type="submit" disabled={createEvaluation.isPending}>
          حفظ التقييم
        </Button>
      </div>
    </form>
  );
}

function ModalVacationForm({ member, onSuccess }) {
  const [vacationChoice, setVacationChoice] = useState("request"); // 'request' or 'balance'
  const createRequest = useCreateVacationRequest();
  const createTransaction = useCreateVacationTransaction();

  // Form state with automatic date/days calculation
  const [reqForm, setReqForm] = useState({ start_date: "", end_date: "", days: "", reason: "" });
  const [balForm, setBalForm] = useState({ days: "", reason: "" });

  // Automatic calculation of days when start_date & end_date change
  function handleStartDateChange(dateVal) {
    const nextForm = { ...reqForm, start_date: dateVal };
    if (dateVal && reqForm.end_date) {
      const start = new Date(dateVal);
      const end = new Date(reqForm.end_date);
      if (end >= start) {
        const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
        nextForm.days = String(diffDays);
      }
    }
    setReqForm(nextForm);
  }

  function handleEndDateChange(dateVal) {
    const nextForm = { ...reqForm, end_date: dateVal };
    if (reqForm.start_date && dateVal) {
      const start = new Date(reqForm.start_date);
      const end = new Date(dateVal);
      if (end >= start) {
        const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
        nextForm.days = String(diffDays);
      }
    }
    setReqForm(nextForm);
  }

  async function handleCreateRequest(e) {
    e.preventDefault();
    if (!reqForm.start_date || !reqForm.end_date || !reqForm.days) return;
    try {
      await createRequest.mutateAsync({ member: member.id, ...reqForm });
      showToast("تم تقديم طلب الإجازة بنجاح");
      onSuccess();
    } catch (err) {
      showToast(err?.response?.data?.non_field_errors?.[0] || "تعذر تقديم الطلب", "error");
    }
  }

  async function handleAdjustBalance(e) {
    e.preventDefault();
    if (!balForm.days) return;
    try {
      await createTransaction.mutateAsync({
        member: member.id,
        days: Number(balForm.days),
        reason: balForm.reason || "تعديل إداري لرصيد الإجازات",
      });
      showToast("تم تعديل رصيد الإجازات بنجاح");
      onSuccess();
    } catch {
      showToast("تعذر تعديل الرصيد", "error");
    }
  }

  return (
    <div className="space-y-5">
      {/* High-Contrast Vacation Option Switcher */}
      <div className="grid grid-cols-2 gap-2.5 p-1.5 rounded-2xl bg-muted/60 border border-border/80">
        <button
          type="button"
          onClick={() => setVacationChoice("request")}
          className={`py-2.5 px-3 text-caption font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            vacationChoice === "request"
              ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30"
              : "bg-card text-muted-foreground hover:text-foreground hover:bg-card/80"
          }`}
        >
          <Palmtree className="h-4.5 w-4.5 shrink-0" />
          <span>تقديم طلب إجازة رسمية</span>
        </button>

        <button
          type="button"
          onClick={() => setVacationChoice("balance")}
          className={`py-2.5 px-3 text-caption font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            vacationChoice === "balance"
              ? "bg-amber-600 text-white shadow-sm ring-1 ring-amber-600/30"
              : "bg-card text-muted-foreground hover:text-foreground hover:bg-card/80"
          }`}
        >
          <ArrowRightLeft className="h-4.5 w-4.5 shrink-0" />
          <span>تعديل وتكتيك رصيد الإجازات</span>
        </button>
      </div>

      {vacationChoice === "request" ? (
        <form onSubmit={handleCreateRequest} className="space-y-4 p-4 rounded-2xl border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 border-b border-primary/15 pb-3">
            <Palmtree className="h-5 w-5 text-primary" />
            <h4 className="font-bold text-body text-foreground">تسجيل طلب إجازة فردية جديد</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label required>من تاريخ</Label>
              <Input type="date" value={reqForm.start_date} onChange={(e) => handleStartDateChange(e.target.value)} required className="bg-card" />
            </div>
            <div className="space-y-1.5">
              <Label required>إلى تاريخ</Label>
              <Input type="date" value={reqForm.end_date} onChange={(e) => handleEndDateChange(e.target.value)} required className="bg-card" />
            </div>
            <div className="space-y-1.5">
              <Label required>عدد الأيام (أوتوماتيكي)</Label>
              <Input type="number" step="0.5" min="0.5" value={reqForm.days} onChange={(e) => setReqForm({ ...reqForm, days: e.target.value })} required className="bg-card font-mono font-bold" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>سبب الإجازة / الملاحظات</Label>
            <Textarea value={reqForm.reason} onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })} placeholder="اكتب سبب طلب الإجازة الرسمية..." className="bg-card min-h-20" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-primary/15">
            <Button type="submit" disabled={createRequest.isPending} className="font-bold">
              تقديم طلب الإجازة
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleAdjustBalance} className="space-y-4 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-amber-600" />
              <h4 className="font-bold text-body text-foreground">تسوية وتعديل رصيد الإجازات السنوي</h4>
            </div>
            <div className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-caption font-bold text-amber-700">
              الرصيد المتاح الحالي: <span className="font-mono text-body-sm font-extrabold">{formatNumber(member.vacation_balance_days)} يوم</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label required>عدد الأيام المضافة (+) أو المخصومة (-)</Label>
            <Input
              type="number"
              step="0.5"
              placeholder="مثال: 5 لإضافة 5 أيام، أو -2 لخصم يومين"
              value={balForm.days}
              onChange={(e) => setBalForm({ ...balForm, days: e.target.value })}
              required
              className="bg-card font-mono font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <Label required>سبب التعديل الإداري للرصيد</Label>
            <Textarea
              value={balForm.reason}
              onChange={(e) => setBalForm({ ...balForm, reason: e.target.value })}
              placeholder="مثال: إضافة رصيد سنوي، خصم أيام غياب، مكافأة تشجيعية..."
              required
              className="bg-card min-h-20"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-amber-500/20">
            <Button type="submit" disabled={createTransaction.isPending} className="font-bold bg-amber-600 hover:bg-amber-700 text-white border-amber-600">
              تأكيد تعديل الرصيد
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function ModalPledgeForm({ member, onSuccess }) {
  const createPledge = useCreateMemberPledge();
  const [form, setForm] = useState({ title: "", description: "", issue_date: "", attachment: null });

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      await createPledge.mutateAsync({
        member: member.id,
        title: form.title,
        description: form.description,
        issue_date: form.issue_date || null,
        attachment: form.attachment,
      });
      showToast("تمت إضافة التعهد بنجاح");
      onSuccess();
    } catch {
      showToast("تعذرت إضافة التعهد", "error");
    }
  }

  return (
    <form onSubmit={handleAdd} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label required>عنوان التعهد / الالتزام</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="مثال: تعهد بحفظ السلوك والانضباط"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>تاريخ الإصدار / التوقيع</Label>
          <Input
            type="date"
            value={form.issue_date}
            onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>مرفق التعهد (PDF أو صورة)</Label>
          <Input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setForm({ ...form, attachment: e.target.files[0] || null })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>بيان والتفاصيل الإضافية</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="اكتب أي ملاحظات أو تفاصيل حول هذا التعهد..."
            className="min-h-24"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
        <Button type="submit" disabled={createPledge.isPending} className="font-bold">
          حفظ التعهد بالسجل
        </Button>
      </div>
    </form>
  );
}

function ModalDocumentForm({ member, onSuccess }) {
  const { useList: useDocTypes } = documentTypesApi;
  const { data: docTypes = [] } = useDocTypes();
  const uploadDoc = useUploadMemberDocument();
  const [form, setForm] = useState({ document_type: "", file: null, issue_date: "", expiry_date: "" });

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.document_type || !form.file) return;
    try {
      await uploadDoc.mutateAsync({
        member: member.id,
        document_type: form.document_type,
        file: form.file,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
      });
      showToast("تم رفع وتوثيق المستند بنجاح");
      onSuccess();
    } catch {
      showToast("تعذر رفع المستند", "error");
    }
  }

  return (
    <form onSubmit={handleAdd} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label required>نوع المستند / الوثيقة</Label>
          <Select
            value={form.document_type}
            onChange={(e) => setForm({ ...form, document_type: e.target.value })}
            required
          >
            <option value="">— اختر نوع المستند —</option>
            {docTypes.map((dt) => (
              <option key={dt.id} value={dt.id}>
                {dt.name_ar}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label required>ملف الوثيقة (صورة أو PDF)</Label>
          <Input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setForm({ ...form, file: e.target.files[0] || null })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>تاريخ الإصدار</Label>
          <Input
            type="date"
            value={form.issue_date}
            onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>تاريخ الانتهاء</Label>
          <Input
            type="date"
            value={form.expiry_date}
            onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
        <Button type="submit" disabled={uploadDoc.isPending || !form.file || !form.document_type} className="font-bold">
          حفظ ورفع المستند
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* CAREER RECORD TABS DISPLAY                                                 */
/* -------------------------------------------------------------------------- */

function NotesTab({ member }) {
  const { hasPermission } = useAuth();
  const { data: notes = [], isLoading } = useMemberNotes(member.id);
  const deleteNote = useDeleteMemberNote(member.id);
  const canEdit = hasPermission("member.edit");

  return (
    <div className="space-y-4">
      {isLoading && <LoadingLine />}
      {!isLoading && notes.length === 0 && <EmptyState title="لا توجد ملاحظات مسجلة بالسجل." />}
      <div className="space-y-2.5">
        {notes.map((note) => (
          <div key={note.id} className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card/60 shadow-2xs">
            {note.is_pinned && <Pin className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-body text-foreground whitespace-pre-wrap leading-relaxed">{note.body}</p>
              <p className="text-caption text-muted-foreground mt-2 font-medium">
                {note.author_name || "—"} • {formatDateTime(note.created_at)}
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => deleteNote.mutate(note.id)}
                className="text-muted-foreground hover:text-destructive shrink-0 p-1"
                title="حذف"
              >
                <Trash2 className="h-4 w-4" />
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
  const updateTask = useUpdateMemberTask(member.id);
  const deleteTask = useDeleteMemberTask(member.id);
  const canAssign = hasPermission("task.assign");

  return (
    <div className="space-y-4">
      {isLoading && <LoadingLine />}
      {!isLoading && tasks.length === 0 && <EmptyState title="لا توجد مهام مسندة بالسجل." />}
      <div className="space-y-2.5">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card/60 shadow-2xs">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-body font-bold text-foreground">{task.title}</p>
                <Badge variant={STATUS_VARIANTS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
                <Badge variant="outline">{PRIORITY_LABELS[task.priority]}</Badge>
              </div>
              <p className="text-caption text-muted-foreground mt-1.5">
                {task.assigned_to_name || "غير مسندة"} {task.due_date ? `• الاستحقاق: ${formatDate(task.due_date)}` : ""}
              </p>
            </div>
            {canAssign && task.status !== "done" && (
              <button
                type="button"
                onClick={() => updateTask.mutate({ id: task.id, status: "done" })}
                className="text-muted-foreground hover:text-success shrink-0 p-1"
                title="تعليم كمنجزة"
              >
                <CheckCircle2 className="h-5 w-5" />
              </button>
            )}
            {canAssign && (
              <button
                type="button"
                onClick={() => deleteTask.mutate(task.id)}
                className="text-muted-foreground hover:text-destructive shrink-0 p-1"
                title="حذف"
              >
                <Trash2 className="h-4 w-4" />
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
  const deleteEvaluation = useDeleteMemberEvaluation(member.id);
  const canEdit = hasPermission("member.edit");

  return (
    <div className="space-y-4">
      {isLoading && <LoadingLine />}
      {!isLoading && evaluations.length === 0 && <EmptyState title="لا توجد تقييمات مسجلة بالسجل." />}
      <div className="space-y-2.5">
        {evaluations.map((ev) => (
          <div key={ev.id} className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card/60 shadow-2xs">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-label font-bold text-foreground">
                  {formatDate(ev.period_start)} — {formatDate(ev.period_end)}
                </p>
                {ev.score != null && <Badge variant="info">{formatNumber(ev.score)} / 10</Badge>}
              </div>
              <p className="text-body text-foreground whitespace-pre-wrap mt-1.5 leading-relaxed">{ev.body}</p>
              <p className="text-caption text-muted-foreground mt-2 font-medium">{ev.evaluator_name || "—"}</p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => deleteEvaluation.mutate(ev.id)}
                className="text-muted-foreground hover:text-destructive shrink-0 p-1"
                title="حذف"
              >
                <Trash2 className="h-4 w-4" />
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
  const decide = useDecideVacationRequest(member.id);
  const canApprove = hasPermission("vacation.approve");

  return (
    <div className="space-y-5">
      {/* Balance Summary Header */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5">
        <div>
          <p className="text-caption font-bold text-muted-foreground">رصيد الإجازات السنوي الحالي</p>
          <p className="text-display font-bold text-primary">{formatNumber(member.vacation_balance_days)} يوم</p>
        </div>
      </div>

      {isLoading && <LoadingLine />}
      {!isLoading && requests.length === 0 && <EmptyState title="لا توجد طلبات إجازة بالسجل." />}
      <div className="space-y-2.5">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card/60 shadow-2xs">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-body font-bold text-foreground">
                  {formatDate(r.start_date)} — {formatDate(r.end_date)} ({formatNumber(r.days)} يوم)
                </p>
                <Badge variant={VACATION_STATUS_VARIANTS[r.status]}>{VACATION_STATUS_LABELS[r.status]}</Badge>
              </div>
              {r.reason && <p className="text-caption text-muted-foreground mt-1.5">{r.reason}</p>}
            </div>
            {canApprove && r.status === "pending" && (
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" variant="default" onClick={() => decide.mutate({ id: r.id, decision: "approve" })}>
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

      {/* Vacation Balance Ledger */}
      {ledger.length > 0 && (
        <div className="pt-2">
          <p className="text-label font-bold text-foreground mb-2 flex items-center gap-1.5">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            سجل حركة الرصيد والتخصيص
          </p>
          <div className="space-y-1.5">
            {ledger.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-caption p-2.5 rounded-lg bg-secondary/30 border border-border/40">
                <span className="text-foreground font-medium">{t.reason || t.kind} • {formatDateTime(t.created_at)}</span>
                <span className={`font-bold font-mono ${Number(t.days) < 0 ? "text-destructive" : "text-success"}`}>
                  {Number(t.days) > 0 ? "+" : ""}{formatNumber(t.days)} يوم
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
