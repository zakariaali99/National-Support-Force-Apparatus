import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function useActivityLog(params) {
  return useQuery({
    queryKey: ["activity-log", params],
    queryFn: async () => (await api.get("audit/activity/", { params })).data,
  });
}

export function useAuditStats() {
  return useQuery({
    queryKey: ["audit-stats"],
    queryFn: async () => (await api.get("audit/activity/stats/")).data,
  });
}

export function useHistory(model, id) {
  return useQuery({
    queryKey: ["audit-history", model, id],
    queryFn: async () => (await api.get("audit/history/", { params: { model, id } })).data,
    enabled: Boolean(model && id),
  });
}
