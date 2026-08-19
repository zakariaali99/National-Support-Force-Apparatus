import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { createResourceHooks } from "../../lib/createResourceHooks";

export const vehiclesApi = createResourceHooks("vehicles", "transportation/vehicles/");
export const externalUnitsApi = createResourceHooks("external-units", "transportation/external-units/");

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
      const { data } = await api.get("transportation/external-units/", { params });
      return data;
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
