import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { createResourceHooks } from "../../lib/createResourceHooks";

export const vehiclesApi = createResourceHooks("vehicles", "transportation/vehicles/");

export const useVehicles = (params = {}) => {
  return useQuery({
    queryKey: ["vehicles", params],
    queryFn: async () => {
      const { data } = await api.get("transportation/vehicles/", { params });
      return data;
    },
  });
};

export const useCreateVehicle = vehiclesApi.useCreate;
export const useUpdateVehicle = vehiclesApi.useUpdate;
export const useDeleteVehicle = vehiclesApi.useDelete;
