import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";

export function useMembers(params) {
  return useQuery({
    queryKey: ["members", params],
    queryFn: async () => (await api.get("members/", { params })).data,
  });
}

export function useMember(id) {
  return useQuery({
    queryKey: ["members", "detail", id],
    queryFn: async () => (await api.get(`members/${id}/`)).data,
    enabled: Boolean(id),
  });
}

function toFormData(values) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    formData.append(key, value);
  });
  return formData;
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values) =>
      api.post("members/", toFormData(values)).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...values }) =>
      api.patch(`members/${id}/`, toFormData(values)).then((r) => r.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["members", "detail", id] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`members/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useSubmitMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`members/${id}/submit/`).then((r) => r.data),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["members", "detail", id] });
    },
  });
}

export function useApproveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => api.post(`members/${id}/approve/`).then((r) => r.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["members", "detail", id] });
    },
  });
}

export function useRejectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) =>
      api.post(`members/${id}/reject/`, { reason }).then((r) => r.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["members", "detail", id] });
    },
  });
}


export function useMemberDocuments(memberId) {
  return useQuery({
    queryKey: ["member-documents", memberId],
    queryFn: async () => (await api.get("member-documents/", { params: { member: memberId, page_size: 100 } })).data.results,
    enabled: Boolean(memberId),
  });
}

export function useUploadMemberDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ member, document_type, file, issue_date, expiry_date }) => {
      const formData = new FormData();
      formData.append("member", member);
      formData.append("document_type", document_type);
      formData.append("file", file);
      if (issue_date) formData.append("issue_date", issue_date);
      if (expiry_date) formData.append("expiry_date", expiry_date);
      return api.post("member-documents/", formData).then((r) => r.data);
    },
    onSuccess: (_, { member }) =>
      queryClient.invalidateQueries({ queryKey: ["member-documents", member] }),
  });
}

export function useDeleteMemberDocument(memberId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`member-documents/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["member-documents", memberId] }),
  });
}

/** Fetch a private, authenticated file (photo/document) as a blob URL.
 * Plain <img src="..."> can't send an Authorization header, so avatars
 * and document previews go through this instead.
 */
export async function fetchAuthedBlobUrl(url) {
  const { data } = await api.get(url, { responseType: "blob" });
  return URL.createObjectURL(data);
}
