import React, { useState, useMemo } from "react";
import { useShiftRosters, useCreateShiftRoster, useUpdateShiftRoster, useDeleteShiftRoster } from "./api";
import { useFactions } from "../organization/api";
import { useMembers } from "../members/api";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/Dialog";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Select } from "../../components/ui/Select";
import { showToast } from "../../components/ui/Toast";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Sparkles,
  Search,
  Check,
  Building2,
  Clock,
  Shield,
  Layers,
} from "lucide-react";

const SHIFT_TEMPLATES = [
  {
    id: "daily_admin",
    name: "دوام إداري منتظم",
    description: "العمل من الأحد إلى الخميس، وعطلة الجمعة والسبت.",
    cycle_days: 7,
    work_days: 5,
    rest_days: 2,
    shift_hours: 8,
  },
  {
    id: "alert_24_72",
    name: "نظام الإنذار والتمركز (24 / 72)",
    description: "خدمة 24 ساعة تليها 3 أيام راحة (نظام 4 نوبات: أ، ب، ج، د).",
    cycle_days: 4,
    work_days: 1,
    rest_days: 3,
    shift_hours: 24,
  },
  {
    id: "guard_24_96",
    name: "نظام الحراسات الممتد (24 / 96)",
    description: "خدمة 24 ساعة تليها 4 أيام راحة (نظام 5 نوبات).",
    cycle_days: 5,
    work_days: 1,
    rest_days: 4,
    shift_hours: 24,
  },
  {
    id: "custom",
    name: "نظام مخصص (تحديد أيام العمل والراحة)",
    description: "تحديد مرن لعدد أيام العمل المتتالية وأيام الراحة وساعات النوبة.",
    cycle_days: 4,
    work_days: 1,
    rest_days: 3,
    shift_hours: 24,
  },
];

const SHIFT_LETTERS = [
  { offset: 0, label: "النوبة الأولى (أ / وردية 1)" },
  { offset: 1, label: "النوبة الثانية (ب / وردية 2)" },
  { offset: 2, label: "النوبة الثالثة (ج / وردية 3)" },
  { offset: 3, label: "النوبة الرابعة (د / وردية 4)" },
  { offset: 4, label: "النوبة الخامسة (هـ / وردية 5)" },
];

export function ShiftRostersPage() {
  const [editingGroup, setEditingGroup] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedFactionFilter, setSelectedFactionFilter] = useState("all");

  const { data: factions = [] } = useFactions();
  const { data: rosters = [], isLoading } = useShiftRosters();
  const { data: membersData } = useMembers({ page_size: 500 });
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
    work_days: 1,
    rest_days: 3,
    shift_letter_offset: 0,
    shift_hours: 24,
    member_ids: [],
  });

  const handleOpenCreate = (templateId = "alert_24_72", factionId = null) => {
    setEditingGroup(null);
    setMemberSearch("");
    const tpl = SHIFT_TEMPLATES.find((t) => t.id === templateId) || SHIFT_TEMPLATES[1];
    setFormData({
      name_ar: "",
      faction: factionId ? String(factionId) : factions[0]?.id ? String(factions[0].id) : "",
      pattern: tpl.id,
      work_days: tpl.work_days,
      rest_days: tpl.rest_days,
      shift_letter_offset: 0,
      shift_hours: tpl.shift_hours,
      member_ids: [],
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (group) => {
    setEditingGroup(group);
    setMemberSearch("");
    setFormData({
      name_ar: group.name_ar,
      faction: group.faction ? String(group.faction) : "",
      pattern: group.pattern,
      work_days: group.work_days || 1,
      rest_days: group.rest_days || 3,
      shift_letter_offset: group.group_offset || 0,
      shift_hours: group.shift_hours || 24,
      member_ids: group.member_ids || (group.members ? group.members.map((m) => m.id) : []),
    });
    setFormOpen(true);
  };

  const handleToggleMember = (memberId) => {
    setFormData((prev) => {
      const exists = prev.member_ids.includes(memberId);
      return {
        ...prev,
        member_ids: exists
          ? prev.member_ids.filter((id) => id !== memberId)
          : [...prev.member_ids, memberId],
      };
    });
  };

  const handleSelectAllFactionMembers = () => {
    const factionMembers = members.filter((m) => String(m.faction) === String(formData.faction));
    const allIds = factionMembers.map((m) => m.id);
    setFormData((prev) => ({
      ...prev,
      member_ids: Array.from(new Set([...prev.member_ids, ...allIds])),
    }));
  };

  const handleDeselectAllMembers = () => {
    setFormData((prev) => ({ ...prev, member_ids: [] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name_ar.trim() || !formData.faction) {
      showToast("يرجى إدخال اسم النوبة واختيار الفصيل", "error");
      return;
    }

    const tpl = SHIFT_TEMPLATES.find((t) => t.id === formData.pattern) || SHIFT_TEMPLATES[1];
    const isCustom = formData.pattern === "custom";
    const workDays = isCustom ? parseInt(formData.work_days) || 1 : tpl.work_days;
    const restDays = isCustom ? parseInt(formData.rest_days) || 1 : tpl.rest_days;
    const cycleDays = isCustom ? workDays + restDays : tpl.cycle_days;

    const payload = {
      name_ar: formData.name_ar.trim(),
      faction: parseInt(formData.faction),
      pattern: formData.pattern,
      cycle_days: cycleDays,
      work_days: workDays,
      rest_days: restDays,
      anchor_date: "2026-01-01",
      group_offset: parseInt(formData.shift_letter_offset) || 0,
      shift_hours: parseFloat(formData.shift_hours) || tpl.shift_hours,
      member_ids: formData.member_ids,
      is_active: true,
    };

    try {
      if (editingGroup) {
        await updateRoster.mutateAsync({ id: editingGroup.id, payload });
        showToast("تم تحديث بيانات النوبة بنجاح", "success");
      } else {
        await createRoster.mutateAsync(payload);
        showToast("تم إنشاء مجموعة النوبة بنجاح", "success");
      }
      setFormOpen(false);
    } catch {
      showToast("تعذر حفظ بيانات النوبة", "error");
    }
  };

  const handleDelete = async (group) => {
    if (!window.confirm(`هل أنت متأكد من حذف ${group.name_ar}؟`)) return;
    try {
      await deleteRoster.mutateAsync(group.id);
      showToast("تم حذف النوبة بنجاح", "success");
    } catch {
      showToast("تعذر حذف النوبة", "error");
    }
  };

  // Filtered Roster Cards
  const filteredRosters = useMemo(() => {
    if (selectedFactionFilter === "all") return rosters;
    return rosters.filter((r) => String(r.faction) === String(selectedFactionFilter));
  }, [rosters, selectedFactionFilter]);

  // Filtered member options inside form
  const availableMembers = useMemo(() => {
    if (!formData.faction) return [];
    return members
      .filter((m) => String(m.faction) === String(formData.faction))
      .filter((m) => {
        if (!memberSearch.trim()) return true;
        const q = memberSearch.toLowerCase();
        return (
          m.full_name.toLowerCase().includes(q) ||
          (m.force_number && m.force_number.toLowerCase().includes(q))
        );
      });
  }, [members, formData.faction, memberSearch]);

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="إدارة النوبات والورديات"
        description="توزيع أفراد القوة على النوبات التكتيكية، الدوام الإداري، والورديات مع جدول الدوام المعتمد."
      >
        <Button
          variant="primary"
          onClick={() => handleOpenCreate()}
          className="gap-2 rounded-2xl font-bold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة نوبة / وردية جديدة</span>
        </Button>
      </PageHeader>

      {/* Preset Fast Creation Bar */}
      <div className="rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-body font-bold text-slate-900 dark:text-white">
            <Sparkles className="w-5 h-5 text-[#2B95E8]" />
            <span>إنشاء سريع طبقاً للنظم المعتمدة:</span>
          </div>

          <div className="flex items-center gap-3 min-w-[240px]">
            <span className="text-label text-slate-600 dark:text-gray-300 font-bold whitespace-nowrap">تصفية الفصيل:</span>
            <Select
              value={selectedFactionFilter}
              onValueChange={setSelectedFactionFilter}
              options={[
                { value: "all", label: "كافة الفصائل" },
                ...factions.map((f) => ({ value: String(f.id), label: f.name_ar })),
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {SHIFT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleOpenCreate(tpl.id)}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 hover:border-[#2B95E8] text-start transition-all duration-150 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-body-sm text-slate-900 dark:text-white group-hover:text-[#2B95E8]">
                  {tpl.name}
                </span>
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-[#2B95E8]" />
              </div>
              <p className="text-caption text-slate-500 dark:text-gray-400 mt-1 font-normal leading-relaxed">
                {tpl.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-slate-500">
            جاري تحميل مجموعات النوبات...
          </div>
        ) : filteredRosters.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-white dark:bg-[#1A2038] rounded-[28px] border border-slate-200/80 dark:border-white/10">
            لا توجد مجموعات نوبات مسجلة لهذا الفصيل. انقر على زر إضافة نوبة جديدة للبدء.
          </div>
        ) : (
          filteredRosters.map((group) => {
            const memberCount = group.members_count || group.member_ids?.length || (group.members ? group.members.length : 0);
            return (
              <Card
                key={group.id}
                className="rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] shadow-sm hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-white/10 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-body font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#2B95E8]" />
                      <span>{group.name_ar}</span>
                    </CardTitle>
                    <CardDescription className="text-caption text-slate-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{group.faction_name || "الفصيل التابع"}</span>
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(group)}
                      className="h-8 w-8 p-0 rounded-xl text-[#2B95E8]"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(group)}
                      className="h-8 w-8 p-0 rounded-xl text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-3.5">
                  <div className="flex items-center justify-between text-caption">
                    <span className="text-slate-500 dark:text-gray-400 font-medium">نظام الخدمة:</span>
                    <Badge variant="navy" className="font-bold">
                      {group.pattern_display || group.pattern}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-caption">
                    <span className="text-slate-500 dark:text-gray-400 font-medium">ساعات الوردية:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-gray-200">
                      {group.shift_hours || 24} ساعة
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-caption font-bold text-slate-700 dark:text-gray-300">
                      <Users className="w-4 h-4 text-[#2B95E8]" />
                      <span>قوة النوبة:</span>
                    </div>
                    <Badge variant="gold" className="font-bold">
                      {memberCount} فرد
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Simplified Add / Edit Shift Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038]">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
            <div className="space-y-1 text-start">
              <DialogTitle className="text-title font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#2B95E8]" />
                <span>{editingGroup ? "تعديل بيانات النوبة والوردية" : "إضافة نوبة ووردية جديدة"}</span>
              </DialogTitle>
              <DialogDescription className="text-caption text-slate-500 dark:text-gray-400">
                تحديد اسم النوبة، الفصيل، ونظام الدوام مع تعيين أفراد القوة
              </DialogDescription>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5 text-start">
                <Label className="text-caption font-bold text-slate-700 dark:text-gray-300">اسم النوبة / المجموعة *</Label>
                <Input
                  placeholder="مثال: نوبة الإنذار (أ) أو وردية الطوارئ 1"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  required
                  className="rounded-2xl h-11"
                />
              </div>

              {/* Faction */}
              <div className="space-y-1.5 text-start">
                <Label className="text-caption font-bold text-slate-700 dark:text-gray-300">الفصيل التابع *</Label>
                <Select
                  value={formData.faction}
                  onValueChange={(val) => setFormData({ ...formData, faction: val, member_ids: [] })}
                  options={factions.map((f) => ({ value: String(f.id), label: f.name_ar }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shift Template / Pattern */}
              <div className="space-y-1.5 text-start">
                <Label className="text-caption font-bold text-slate-700 dark:text-gray-300">نظام الدوام / نمط الخدمة *</Label>
                <Select
                  value={formData.pattern}
                  onValueChange={(val) => {
                    const t = SHIFT_TEMPLATES.find((x) => x.id === val);
                    setFormData({
                      ...formData,
                      pattern: val,
                      work_days: t ? t.work_days : 1,
                      rest_days: t ? t.rest_days : 3,
                      shift_hours: t ? t.shift_hours : 24,
                    });
                  }}
                  options={SHIFT_TEMPLATES.map((t) => ({ value: t.id, label: t.name }))}
                />
              </div>

              {/* Shift Offset / Letter */}
              <div className="space-y-1.5 text-start">
                <Label className="text-caption font-bold text-slate-700 dark:text-gray-300">ترتيب النوبة في الدورة *</Label>
                <Select
                  value={String(formData.shift_letter_offset)}
                  onValueChange={(val) => setFormData({ ...formData, shift_letter_offset: parseInt(val) })}
                  options={SHIFT_LETTERS.map((l) => ({ value: String(l.offset), label: l.label }))}
                />
              </div>
            </div>

            {/* Custom Cycle Settings */}
            {formData.pattern === "custom" && (
              <div className="p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-start">
                <div className="space-y-1.5">
                  <Label className="text-caption font-bold text-slate-700 dark:text-gray-300">أيام العمل المتتالية *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={formData.work_days}
                    onChange={(e) => setFormData({ ...formData, work_days: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="rounded-xl h-10 bg-white dark:bg-[#1A2038]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-caption font-bold text-slate-700 dark:text-gray-300">أيام الراحة المتتالية *</Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={formData.rest_days}
                    onChange={(e) => setFormData({ ...formData, rest_days: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="rounded-xl h-10 bg-white dark:bg-[#1A2038]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-caption font-bold text-slate-700 dark:text-gray-300">ساعات الوردية *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={48}
                    step={0.5}
                    value={formData.shift_hours}
                    onChange={(e) => setFormData({ ...formData, shift_hours: parseFloat(e.target.value) || 24 })}
                    className="rounded-xl h-10 bg-white dark:bg-[#1A2038]"
                  />
                </div>
                <div className="col-span-full pt-1 text-micro font-bold text-blue-700 dark:text-blue-300 flex items-center justify-between">
                  <span>إجمالي أيام الدورة التكرارية: {(parseInt(formData.work_days) || 1) + (parseInt(formData.rest_days) || 0)} أيام</span>
                  <span>(تكرار منتظم للوردية والراحة)</span>
                </div>
              </div>
            )}

            {/* Member Multi-Select Card */}
            <div className="space-y-2.5 text-start">
              <div className="flex items-center justify-between">
                <Label className="text-caption font-bold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#2B95E8]" />
                  <span>أفراد القوة المعينون بالنوبة ({formData.member_ids.length} فرد محدد)</span>
                </Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllFactionMembers}
                    className="text-caption font-bold text-[#2B95E8] hover:underline"
                  >
                    تحديد جميع أفراد الفصيل
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllMembers}
                    className="text-caption font-medium text-rose-500 hover:underline"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>

              {/* Search within faction members */}
              <div className="relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="ابحث عن فرد لإضافته للنوبة..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pr-10 rounded-2xl h-10 text-body-sm"
                />
              </div>

              {/* Members Scroll List */}
              <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-white/10 p-2 space-y-1 bg-slate-50/50 dark:bg-white/5">
                {availableMembers.length === 0 ? (
                  <div className="p-6 text-center text-caption text-slate-500">
                    لا يوجد أفراد متاحون في هذا الفصيل.
                  </div>
                ) : (
                  availableMembers.map((m) => {
                    const isSelected = formData.member_ids.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleToggleMember(m.id)}
                        className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-blue-50/80 dark:bg-blue-950/40 border border-[#2B95E8]/40"
                            : "hover:bg-slate-100 dark:hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                              isSelected
                                ? "bg-[#2B95E8] border-[#2B95E8] text-white"
                                : "border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="font-bold text-body-sm text-slate-900 dark:text-white">
                              {m.full_name}
                            </span>
                            <span className="text-caption text-slate-500 dark:text-gray-400 ms-2 font-mono">
                              ({m.force_number || "—"})
                            </span>
                          </div>
                        </div>

                        <Badge variant="navy" className="text-caption">
                          {m.rank_name || "عضو"}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <DialogFooter className="p-4 pt-5 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between -mx-6 -mb-6">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl">
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={createRoster.isPending || updateRoster.isPending}
                className="gap-2 rounded-xl font-bold px-5"
              >
                <Check className="w-4 h-4" />
                <span>{editingGroup ? "حفظ التعديلات" : "إنشاء النوبة"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ShiftRostersPage;
