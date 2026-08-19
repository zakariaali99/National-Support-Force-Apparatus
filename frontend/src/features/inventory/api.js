import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { createResourceHooks } from "../../lib/createResourceHooks";

export const inventoryApi = createResourceHooks("inventory-items", "equipment/items/");
export const categoriesApi = createResourceHooks("equipment-categories", "equipment/categories/");

export const useInventoryItems = inventoryApi.useList;
export const useCreateInventoryItem = inventoryApi.useCreate;
export const useUpdateInventoryItem = inventoryApi.useUpdate;
export const useDeleteInventoryItem = inventoryApi.useDelete;

export const useCategories = categoriesApi.useList;
export const useCreateCategory = categoriesApi.useCreate;
export const useUpdateCategory = categoriesApi.useUpdate;
export const useDeleteCategory = categoriesApi.useDelete;

export const useAssignCustody = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, payload }) => {
      const { data } = await api.post(`equipment/items/${itemId}/assign-custody/`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipment-items"] });
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
      qc.invalidateQueries({ queryKey: ["armory-items"] });
    },
  });
};

export const useReleaseCustody = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, payload = {} }) => {
      const { data } = await api.post(`equipment/items/${itemId}/release-custody/`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipment-items"] });
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
      qc.invalidateQueries({ queryKey: ["armory-items"] });
    },
  });
};

export const useMarkDamaged = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, payload = {} }) => {
      const { data } = await api.post(`equipment/items/${itemId}/mark-damaged/`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipment-items"] });
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
      qc.invalidateQueries({ queryKey: ["armory-items"] });
    },
  });
};
