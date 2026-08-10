import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Grid, List, HelpCircle, ArrowUpRight, FileSpreadsheet, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { AuthedImage } from "../../components/ui/AuthedImage";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { showToast } from "../../components/ui/Toast";
import { useAuth } from "../auth/AuthContext";
import { factionsApi, ranksApi } from "../organization/api";
import { downloadAuthedFile } from "../reports/api";
import { useMembers } from "./api";
import { SERVICE_STATUS_OPTIONS, serviceStatusLabel } from "./constants";

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
  const canExport = hasPermission("member.export");
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [faction, setFaction] = useState("");
  const [rank, setRank] = useState("");
  const [serviceStatus, setServiceStatus] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

  const debouncedSearch = useDebouncedValue(search);
  useEffect(() => setPage(1), [debouncedSearch, faction, rank, serviceStatus]);

  const { data: ranks = [] } = ranksApi.useList({ ordering: "order" });
  const { data: factions = [] } = factionsApi.useList({ ordering: "name_ar" });

  const { data, isLoading } = useMembers({
    search: debouncedSearch || undefined,
    faction: faction || undefined,
    rank: rank || undefined,
    service_status: serviceStatus || undefined,
    page,
  });

  const members = data?.results ?? [];

  // Helper to determine status badge variant
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

  // Active filter count calculation
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

  return (
    <div className="space-y-6">
      {/* Top Banner Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">سجل الأعضاء</h1>
          <p className="text-sm text-muted-foreground">
            إدارة وعرض ملفات أعضاء القوى المساندة، مع إمكانية الفرز والتصفية المتقدمة.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:self-center shrink-0">
          {canExport && (
            <Button variant="outline" disabled={exporting} onClick={handleExport}>
              {exporting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="me-2 h-4 w-4" />}
              تصدير Excel
            </Button>
          )}
          {canCreate && (
            <Button asChild className="shadow-md">
              <Link to="/members/new">
                <Plus className="me-2 h-4 w-4" />
                إضافة عضو جديد
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filter and View Selector Controls */}
      <Card className="glass-card shadow-sm border-border/40">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، الرقم الحربي، أو الرقم الوطني..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9 bg-card/50"
              />
            </div>

            {/* View Mode Toggles */}
            <div className="flex items-center gap-2 self-end">
              {activeFiltersCount > 0 && (
                <Badge variant="info" className="text-[10px] py-1">
                  مصفاة نشطة: {activeFiltersCount}
                </Badge>
              )}
              <div className="flex rounded-lg border border-border p-1 bg-secondary/20">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewMode === "grid"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="عرض شبكي"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewMode === "list"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="عرض جدول"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Select Dropdown Filters */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-muted-foreground">الفصيل</Label>
              <Select value={faction} onChange={(e) => setFaction(e.target.value)} className="bg-card/50">
                <option value="">كل الفصائل</option>
                {factions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name_ar}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-muted-foreground">الرتبة</Label>
              <Select value={rank} onChange={(e) => setRank(e.target.value)} className="bg-card/50">
                <option value="">كل الرتب</option>
                {ranks.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name_ar}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-muted-foreground">الحالة العسكرية</Label>
              <Select value={serviceStatus} onChange={(e) => setServiceStatus(e.target.value)} className="bg-card/50">
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
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Card key={idx} className="overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col items-center space-y-3">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <div className="border-t border-border/50 pt-4 space-y-2">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-10 w-full" />
            ))}
          </div>
        )
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-2xl bg-card space-y-3 animate-fade-in">
          <HelpCircle className="h-12 w-12 text-muted-foreground/45" />
          <h3 className="font-bold text-base text-foreground">لا يوجد نتائج تطابق البحث</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            يرجى مراجعة إدخال البحث أو تغيير الفلاتر المحددة بالأعلى والمحاولة مجدداً.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-slide-up">
          {members.map((member) => (
            <Card key={member.id} className="group hover:shadow-md hover:border-primary/20 transition-all duration-200 flex flex-col justify-between overflow-hidden relative">
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
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">{member.rank_name}</p>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الرقم الحربي:</span>
                    <span className="font-semibold font-mono">{member.force_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الفصيل:</span>
                    <span className="font-semibold text-foreground">{member.faction_name}</span>
                  </div>
                </div>
              </CardContent>
              <div className="bg-secondary/20 border-t border-border/50 p-3">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={`/members/${member.id}`} className="flex items-center justify-center gap-1.5">
                    <span>عرض الملف الشخصي</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm animate-slide-up">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-foreground border-b border-border">
              <tr>
                <th className="w-16 px-4 py-3" />
                <th className="px-4 py-3 text-start font-bold">الاسم الكامل</th>
                <th className="px-4 py-3 text-start font-bold">الرقم الحربي</th>
                <th className="px-4 py-3 text-start font-bold">الرتبة العسكرية</th>
                <th className="px-4 py-3 text-start font-bold">الفصيل (الإدارة)</th>
                <th className="px-4 py-3 text-start font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-secondary/30 transition-colors group">
                  <td className="px-4 py-2">
                    <AuthedImage
                      src={member.photo_thumb_url}
                      alt={member.full_name}
                      className="h-10 w-10 rounded-full border border-border object-cover"
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground group-hover:text-primary transition-colors">
                    <Link to={`/members/${member.id}`} className="hover:underline flex items-center gap-1.5">
                      {member.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono" dir="ltr">
                    {member.force_number}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{member.rank_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{member.faction_name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusVariant(member.service_status)} pulse={member.service_status === "active"}>
                      {serviceStatusLabel(member.service_status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {data && (data.next || data.previous) && (
        <div className="flex items-center justify-between pt-4 border-t border-border/50 animate-fade-in">
          <Button variant="outline" size="sm" disabled={!data.previous} onClick={() => setPage((p) => p - 1)}>
            <ChevronRight className="me-1 h-4 w-4" />
            السابق
          </Button>
          <span className="text-xs font-bold text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
            إجمالي النتائج: {data.count} عضو
          </span>
          <Button variant="outline" size="sm" disabled={!data.next} onClick={() => setPage((p) => p + 1)}>
            التالي
            <ChevronLeft className="ms-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
