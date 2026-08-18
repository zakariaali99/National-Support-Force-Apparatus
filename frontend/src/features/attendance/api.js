import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { createResourceHooks } from "../../lib/createResourceHooks";

export const shiftRostersApi = createResourceHooks("rosters", "attendance/rosters/");
export const dailyAttendanceApi = createResourceHooks("attendance-records", "attendance/records/");

export const useDailySheet = (params = {}) => {
  return useQuery({
    queryKey: ["daily-sheet", params],
    queryFn: async () => {
      const { data } = await api.get("attendance/records/daily-sheet/", { params });
      return data;
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
};

export const useMonthlyMatrix = (params = {}) => {
  return useQuery({
    queryKey: ["monthly-matrix", params],
    queryFn: async () => {
      const { data } = await api.get("attendance/records/monthly-matrix/", { params });
      return data;
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
};

export const useRecordBulkAttendance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("attendance/records/record-bulk/", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-sheet"] });
      qc.invalidateQueries({ queryKey: ["monthly-matrix"] });
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["attendance-records"] });
    },
  });
};

export const useShiftRosters = shiftRostersApi.useList;
export const useCreateShiftRoster = shiftRostersApi.useCreate;
export const useUpdateShiftRoster = shiftRostersApi.useUpdate;
export const useDeleteShiftRoster = shiftRostersApi.useDelete;
