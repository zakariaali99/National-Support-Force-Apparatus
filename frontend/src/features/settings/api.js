import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

// 1. Field Requirements API
export function useFieldRequirements() {
  return useQuery({
    queryKey: ["field-requirements"],
    queryFn: async () => {
      const response = await api.get("settings/field-requirements/");
      return response.data; // Raw array response because pagination_class = None
    },
  });
}

export function useUpdateFieldRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const response = await api.patch(`settings/field-requirements/${id}/`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field-requirements"] });
    },
  });
}

// 2. Roles API
export function useRoles(params) {
  return useQuery({
    queryKey: ["roles", params],
    queryFn: async () => {
      const response = await api.get("roles/", { params });
      return response.data;
    },
  });
}

export function usePermissionGroups() {
  return useQuery({
    queryKey: ["permission-groups"],
    queryFn: async () => {
      const response = await api.get("roles/permissions/");
      return response.data;
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("roles/", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const response = await api.patch(`roles/${id}/`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`roles/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

// 3. Users API
export function useUsers(params) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const response = await api.get("users/", { params });
      return response.data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("users/", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const response = await api.patch(`users/${id}/`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`users/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
