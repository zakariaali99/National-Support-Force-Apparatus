import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

// Notifications — polled, no websockets (see PLAN.md's "Notifications:
// in-app only for v1" decision). 45s matches the plan's 45-60s window.
const NOTIFICATIONS_POLL_MS = 45_000;

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => (await api.get("notifications/unread_count/")).data.count,
    refetchInterval: NOTIFICATIONS_POLL_MS,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications", "list"],
    queryFn: async () => (await api.get("notifications/", { params: { ordering: "-created_at" } })).data,
    refetchInterval: NOTIFICATIONS_POLL_MS,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.post(`notifications/${id}/mark_read/`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post("notifications/mark_all_read/")).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useAssignableUsers() {
  return useQuery({
    queryKey: ["users", "assignable"],
    queryFn: async () => (await api.get("users/assignable/")).data,
  });
}

// Member notes
export function useMemberNotes(memberId) {
  return useQuery({
    queryKey: ["member-notes", memberId],
    queryFn: async () => (await api.get("member-notes/", { params: { member: memberId } })).data.results ?? [],
    enabled: Boolean(memberId),
  });
}

export function useCreateMemberNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post("member-notes/", payload)).data,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["member-notes", variables.member] });
    },
  });
}

export function useDeleteMemberNote(memberId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`member-notes/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-notes", memberId] });
    },
  });
}

// Member tasks
export function useMemberTasks(memberId) {
  return useQuery({
    queryKey: ["member-tasks", memberId],
    queryFn: async () => (await api.get("member-tasks/", { params: { member: memberId } })).data.results ?? [],
    enabled: Boolean(memberId),
  });
}

export function useMyTasks() {
  return useQuery({
    queryKey: ["member-tasks", "mine"],
    queryFn: async () => (await api.get("member-tasks/", { params: { assigned_to_me: 1 } })).data.results ?? [],
  });
}

export function useCreateMemberTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post("member-tasks/", payload)).data,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["member-tasks", variables.member] });
    },
  });
}

export function useUpdateMemberTask(memberId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.patch(`member-tasks/${id}/`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-tasks", memberId] });
    },
  });
}

export function useDeleteMemberTask(memberId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`member-tasks/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-tasks", memberId] });
    },
  });
}

// Member evaluations
export function useMemberEvaluations(memberId) {
  return useQuery({
    queryKey: ["member-evaluations", memberId],
    queryFn: async () => (await api.get("member-evaluations/", { params: { member: memberId } })).data.results ?? [],
    enabled: Boolean(memberId),
  });
}

export function useCreateMemberEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post("member-evaluations/", payload)).data,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["member-evaluations", variables.member] });
    },
  });
}

export function useDeleteMemberEvaluation(memberId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`member-evaluations/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-evaluations", memberId] });
    },
  });
}

// Vacation requests + ledger
export function useVacationRequests(memberId) {
  return useQuery({
    queryKey: ["vacation-requests", memberId],
    queryFn: async () => (await api.get("vacation-requests/", { params: { member: memberId } })).data.results ?? [],
    enabled: Boolean(memberId),
  });
}

export function useVacationTransactions(memberId) {
  return useQuery({
    queryKey: ["vacation-transactions", memberId],
    queryFn: async () => (await api.get("vacation-transactions/", { params: { member: memberId } })).data.results ?? [],
    enabled: Boolean(memberId),
  });
}

export function useCreateVacationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post("vacation-requests/", payload)).data,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vacation-requests", variables.member] });
    },
  });
}

export function useDecideVacationRequest(memberId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decision }) => (await api.post(`vacation-requests/${id}/${decision}/`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacation-requests", memberId] });
      queryClient.invalidateQueries({ queryKey: ["vacation-transactions", memberId] });
      queryClient.invalidateQueries({ queryKey: ["members", "detail", String(memberId)] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useCreateVacationTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post("vacation-transactions/", payload)).data,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vacation-transactions", variables.member] });
      queryClient.invalidateQueries({ queryKey: ["members", "detail", String(variables.member)] });
    },
  });
}
