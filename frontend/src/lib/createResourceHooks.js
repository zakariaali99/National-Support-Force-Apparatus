import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./api";

/** Standard TanStack Query CRUD hooks for a DRF ModelViewSet endpoint.
 *
 * Every simple lookup resource in this app (ranks, factions, document
 * types, and more added in later phases) is a plain paginated
 * list/create/update/soft-delete endpoint — this factory avoids
 * rewriting the same four hooks per resource. Pages needing resource-
 * specific fields or validation still write their own form/dialog; this
 * only covers data-fetching.
 */
export function createResourceHooks(key, endpoint) {
  function useList(params) {
    return useQuery({
      queryKey: [key, params],
      queryFn: async () =>
        (await api.get(endpoint, { params: { page_size: 200, ...params } })).data.results,
    });
  }

  function useCreate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload) => api.post(endpoint, payload).then((r) => r.data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
    });
  }

  function useUpdate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, ...payload }) =>
        api.patch(`${endpoint}${id}/`, payload).then((r) => r.data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
    });
  }

  function useRemove() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id) => api.delete(`${endpoint}${id}/`),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
    });
  }

  return { useList, useCreate, useUpdate, useRemove, useDelete: useRemove };
}
