import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { createResourceHooks } from "../../lib/createResourceHooks";

export const vehiclesApi = createResourceHooks("vehicles", "transportation/vehicles/");
export const externalUnitsApi = createResourceHooks("external-units", "transportation/external-units/");
export const vehicleCustodyApi = createResourceHooks("vehicle-custody-records", "transportation/vehicle-custody-records/");

export const useVehicles = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["vehicles", params],
    queryFn: async () => {
      const { data } = await api.get("transportation/vehicles/", { params });
      return data;
    },
    ...options,
  });
};

export const useExternalUnits = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["external-units", params],
    queryFn: async () => {
      const { data } = await api.get("transportation/external-units/", { params: { page_size: 200, ...params } });
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.results)) return data.results;
      return [];
    },
    ...options,
  });
};

export const useVehicleCustodyRecords = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["vehicle-custody-records", params],
    queryFn: async () => {
      const { data } = await api.get("transportation/vehicle-custody-records/", { params: { page_size: 200, ...params } });
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.results)) return data.results;
      return [];
    },
    ...options,
  });
};

export const useCreateVehicle = vehiclesApi.useCreate;
export const useUpdateVehicle = vehiclesApi.useUpdate;
export const useDeleteVehicle = vehiclesApi.useDelete;

export const useCreateExternalUnit = externalUnitsApi.useCreate;
export const useUpdateExternalUnit = externalUnitsApi.useUpdate;
export const useDeleteExternalUnit = externalUnitsApi.useDelete;

export const useReturnVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.post(`transportation/vehicles/${id}/return-vehicle/`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-custody-records"] });
    },
  });
};

export const useAssignDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.post(`transportation/vehicles/${id}/assign-driver/`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-custody-records"] });
    },
  });
};
