import { useEffect, useState } from "react";

import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";

import { AuthedImage } from "../../components/ui/AuthedImage";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useAuth } from "../auth/AuthContext";
import { factionsApi, ranksApi } from "../organization/api";
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

  const [search, setSearch] = useState("");
  const [faction, setFaction] = useState("");
  const [rank, setRank] = useState("");
  const [serviceStatus, setServiceStatus] = useState("");
  const [page, setPage] = useState(1);

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>الأعضاء</CardTitle>
          {canCreate && (
            <Button asChild size="sm">
              <Link to="/members/new">
                <Plus className="h-4 w-4" />
                إضافة عضو
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو الرقم الحربي أو الرقم الوطني"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pe-9"
              />
            </div>
            <Select value={faction} onChange={(e) => setFaction(e.target.value)}>
              <option value="">كل الفصائل</option>
              {factions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name_ar}
                </option>
              ))}
            </Select>
            <Select value={rank} onChange={(e) => setRank(e.target.value)}>
              <option value="">كل الرتب</option>
              {ranks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name_ar}
                </option>
              ))}
            </Select>
            <Select value={serviceStatus} onChange={(e) => setServiceStatus(e.target.value)}>
              <option value="">كل الحالات</option>
              {SERVICE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">جارِ التحميل...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">لا يوجد أعضاء مطابقون</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-secondary-foreground">
                  <tr>
                    <th className="w-12 px-3 py-2.5" />
                    <th className="px-4 py-2.5 text-start font-medium">الاسم</th>
                    <th className="px-4 py-2.5 text-start font-medium">الرقم الحربي</th>
                    <th className="px-4 py-2.5 text-start font-medium">الرتبة</th>
                    <th className="px-4 py-2.5 text-start font-medium">الفصيل</th>
                    <th className="px-4 py-2.5 text-start font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-secondary/50">
                      <td className="px-3 py-2">
                        <AuthedImage
                          src={member.photo_thumb_url}
                          alt={member.full_name}
                          className="h-9 w-9 rounded-full"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <Link to={`/members/${member.id}`} className="font-medium hover:underline">
                          {member.full_name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5" dir="ltr">
                        {member.force_number}
                      </td>
                      <td className="px-4 py-2.5">{member.rank_name}</td>
                      <td className="px-4 py-2.5">{member.faction_name}</td>
                      <td className="px-4 py-2.5">{serviceStatusLabel(member.service_status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && (data.next || data.previous) && (
            <div className="flex items-center justify-between pt-1">
              <Button variant="outline" size="sm" disabled={!data.previous} onClick={() => setPage((p) => p - 1)}>
                <ChevronRight className="h-4 w-4" />
                السابق
              </Button>
              <span className="text-xs text-muted-foreground">{data.count} عضو</span>
              <Button variant="outline" size="sm" disabled={!data.next} onClick={() => setPage((p) => p + 1)}>
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
