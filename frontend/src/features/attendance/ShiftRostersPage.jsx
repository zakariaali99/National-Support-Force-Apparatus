import React, { useState, useMemo } from "react";
import { useShiftRosters, useCreateShiftRoster, useUpdateShiftRoster, useDeleteShiftRoster } from "./api";
import { useFactions } from "../organization/api";
import { useMembers } from "../members/api";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/Dialog";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Select } from "../../components/ui/Select";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Sparkles,
} from "lucide-react";

const PATTERN_OPTIONS = [
  { value: "alert_24_72", label: "فصيل الإنذار (1 يوم عمل + 3 أيام راحة)" },
  { value: "guard_24_96", label: "فصيل الحراسات (1 يوم عمل + 4 أيام عطلة)" },
  { value: "daily_admin", label: "دوام إداري يومي (أحد - خميس)" },
  { value: "custom", label: "دورة مخصصة" },
];

export default function ShiftRostersPage() {
  const [editingGroup, setEditingGroup] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [testDate, setTestDate] = useState(() => new Date().toISOString().split("T")[0]);

  const { data: factions = [] } = useFactions();
  const { data: rosters = [], isLoading } = useShiftRosters();
  const { data: membersData } = useMembers({ page_size: 300 });
  const members = useMemo(() => {
    return membersData?.results || (Array.isArray(membersData) ? membersData : []);
  }, [membersData]);

  const createRoster = useCreateShiftRoster();
  const updateRoster = useUpdateShiftRoster();
  const deleteRoster = useDeleteShiftRoster();

  // Form State
  const [formData, setFormData] = useState({
    name_ar: "",
    faction: "",
    pattern: "alert_24_72",
    cycle_days: 4,
    work_days: 1,
    rest_days: 3,
    anchor_date: "2026-01-01",
    group_offset: 0,
    shift_hours: 24,
    member_ids: [],
  });

  const handleOpenCreate = (presetPattern = null, factionId = null) => {
    setEditingGroup(null);
    let cycleDays = 4;
    let restDays = 3;
    if (presetPattern === "guard_24_96") {
      cycleDays = 5;
      restDays = 4;
    }
    setFormData({
      name_ar: "",
      faction: factionId ? String(factionId) : factions[0]?.id ? String(factions[0].id) : "",
      pattern: presetPattern || "alert_24_72",
      cycle_days: cycleDays,
      work_days: 1,
      rest_days: restDays,
      anchor_date: "2026-01-01",
      group_offset: 0,
      shift_hours: 24,
      member_ids: [],
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      name_ar: group.name_ar,
      faction: group.faction ? String(group.faction) : "",
      pattern: group.pattern,
      cycle_days: group.cycle_days,
      work_days: group.work_days,
      rest_days: group.rest_days,
      anchor_date: group.anchor_date,
      group_offset: group.group_offset,
      shift_hours: group.shift_hours,
      member_ids: group.member_ids || [],
    });
    setFormOpen(true);
  };

  const handlePatternChange = (pattern) => {
    let cycleDays = 4;
    let restDays = 3;
    let shiftHours = 24;
    if (pattern === "guard_24_96") {
      cycleDays = 5;
      restDays = 4;
    } else if (pattern === "daily_admin") {
      cycleDays = 7;
      restDays = 2;
      shiftHours = 8;
    }
    setFormData((prev) => ({
      ...prev,
      pattern,
      cycle_days: cycleDays,
      rest_days: restDays,
      shift_hours: shiftHours,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      faction: parseInt(formData.faction, 10),
      cycle_days: parseInt(formData.cycle_days, 10),
      work_days: parseInt(formData.work_days, 10),
      rest_days: parseInt(formData.rest_days, 10),
      group_offset: parseInt(formData.group_offset, 10),
      shift_hours: parseFloat(formData.shift_hours),
    };

    if (editingGroup) {
      await updateRoster.mutateAsync({ id: editingGroup.id, data: payload });
    } else {
      await createRoster.mutateAsync(payload);
    }
    setFormOpen(false);
  };

  const isGroupOnDutyOnDate = (group, dateStr) => {
    if (group.pattern === "daily_admin") {
      const d = new Date(dateStr);
      return d.getDay() !== 5 && d.getDay() !== 6; // Friday=5, Saturday=6 in JS getDay
    }
    const target = new Date(dateStr);
    const anchor = new Date(group.anchor_date);
    const diffTime = target.getTime() - anchor.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
    const dayInCycle = ((diffDays + group.group_offset) % group.cycle_days + group.cycle_days) % group.cycle_days;
    return dayInCycle < group.work_days;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="فصائل النوبات والورديات الديناميكية"
        description="إدارة دورات نوبات فصيل الإنذار (1 عمل + 3 راحة)، فصيل الحراسات (1 عمل + 4 عطلة)، وخوارزمية توزيع الخدمة التلقائية."
      >
        <Button variant="primary" onClick={() => handleOpenCreate()} className="gap-1.5">
          <Plus className="w-4 h-4" />
          <span>إضافة نوبة / وردية جديدة</span>
        </Button>
      </PageHeader>

      {/* Live Rotation Simulator Widget */}
      <Card className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-body">محاكي الخوارزمية الفوري</div>
              <div className="text-caption text-slate-500">
                اختبر النوبات المستحقة للخدمة في أي تاريخ تلقائياً وفقاً للمصفوفة الرياضية للدورات
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-label text-slate-700 dark:text-slate-300 font-semibold">تاريخ المعاينة:</span>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Calendar className="w-4 h-4 text-blue-600" />
              <Input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="border-0 p-0 h-auto font-mono text-body-sm font-semibold text-slate-900 dark:text-slate-100 bg-transparent focus:ring-0 shadow-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-slate-500">جاري تحميل مجموعات النوبات...</div>
        ) : rosters.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-500">
            لا توجد نوبات مسجلة بعد. اضغط على زر "إضافة نوبة" لإنشاء أول مجموعة نوبات.
          </div>
        ) : (
          rosters.map((group) => {
            const onDutyToday = isGroupOnDutyOnDate(group, testDate);
            return (
              <Card key={group.id} className="overflow-hidden hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <CardHeader className="p-4 pb-3 flex flex-row items-start justify-between border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-section font-bold text-slate-900 dark:text-slate-100">{group.name_ar}</CardTitle>
                      {onDutyToday ? (
                        <Badge variant="success">واجب / خدمة</Badge>
                      ) : (
                        <Badge variant="secondary">راحة / عطلة</Badge>
                      )}
                    </div>
                    <CardDescription className="text-caption text-slate-500">
                      {group.faction_name || "بدون فصيل"} • {group.pattern_display}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(group)} title="تعديل">
                      <Pencil className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRoster.mutate(group.id)}
                      className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-body-sm">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-caption text-slate-500">دورة النوبة</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 font-mono">{group.cycle_days} أيام</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-caption text-slate-500">ساعات النوبة</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 font-mono">{group.shift_hours} ساعة</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-body-sm pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>قوة النوبة الحالية:</span>
                    </div>
                    <Badge variant="info">
                      {group.members_count || group.member_ids?.length || 0} فرد
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>{editingGroup ? "تعديل مجموعة النوبات" : "إضافة مجموعة نوبات جديدة"}</DialogTitle>
                <DialogDescription>إعداد دورة العمل والراحة وربط الأفراد بالمجموعة الرياضية.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-label text-slate-800 dark:text-slate-200">اسم النوبة / المجموعة *</Label>
              <Input
                placeholder="مثال: نوبة الإنذار (أ) / وردية الحراسات 1"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-label text-slate-800 dark:text-slate-200">الفصيل التابعة له *</Label>
                <Select
                  value={formData.faction}
                  onValueChange={(val) => setFormData({ ...formData, faction: val })}
                  options={factions.map((f) => ({ value: String(f.id), label: f.name_ar }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-label text-slate-800 dark:text-slate-200">نمط ونوع الدورة *</Label>
                <Select
                  value={formData.pattern}
                  onValueChange={handlePatternChange}
                  options={PATTERN_OPTIONS}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-caption text-slate-500">إجمالي الدورة (أيام)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.cycle_days}
                  onChange={(e) => setFormData({ ...formData, cycle_days: e.target.value })}
                  disabled={formData.pattern !== "custom"}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-caption text-slate-500">أيام العمل</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.work_days}
                  onChange={(e) => setFormData({ ...formData, work_days: e.target.value })}
                  disabled={formData.pattern !== "custom"}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-caption text-slate-500">أيام الراحة</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.rest_days}
                  onChange={(e) => setFormData({ ...formData, rest_days: e.target.value })}
                  disabled={formData.pattern !== "custom"}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-caption text-slate-500">ساعات النوبة</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.shift_hours}
                  onChange={(e) => setFormData({ ...formData, shift_hours: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-label text-slate-800 dark:text-slate-200">تاريخ بدء الدورة (Anchor Date) *</Label>
                <Input
                  type="date"
                  value={formData.anchor_date}
                  onChange={(e) => setFormData({ ...formData, anchor_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-label text-slate-800 dark:text-slate-200">إزاحة النوبة (Group Offset) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.group_offset}
                  onChange={(e) => setFormData({ ...formData, group_offset: e.target.value })}
                  placeholder="0 = النوبة الأولى، 1 = الثانية..."
                  required
                />
              </div>
            </div>

            {/* Member Multi-Select List */}
            <div className="space-y-1.5">
              <Label className="text-label text-slate-800 dark:text-slate-200">
                تحديد أفراد النوبة ({formData.member_ids.length} فرد محدد)
              </Label>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200/80 dark:border-slate-700 bg-surface p-2 divide-y divide-slate-100 dark:divide-slate-800">
                {members.map((m) => {
                  const isSelected = formData.member_ids.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-2.5 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({
                              ...prev,
                              member_ids: [...prev.member_ids, m.id],
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              member_ids: prev.member_ids.filter((id) => id !== m.id),
                            }));
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 text-body-sm text-slate-900 dark:text-slate-100 font-medium">
                        {m.full_name}
                      </div>
                      <div className="text-caption text-slate-500 font-mono">
                        {m.force_number || "—"}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" variant="primary">
                {editingGroup ? "حفظ التعديلات" : "إنشاء النوبة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
