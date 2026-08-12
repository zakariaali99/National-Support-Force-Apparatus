import { createResourceHooks } from "../../lib/createResourceHooks";

export const ranksApi = createResourceHooks("ranks", "ranks/");
export const factionsApi = createResourceHooks("factions", "factions/");

export const useFactions = factionsApi.useList;
export const useCreateFaction = factionsApi.useCreate;
export const useUpdateFaction = factionsApi.useUpdate;
export const useDeleteFaction = factionsApi.useDelete;

export const useRanks = ranksApi.useList;
export const useCreateRank = ranksApi.useCreate;
export const useUpdateRank = ranksApi.useUpdate;
export const useDeleteRank = ranksApi.useDelete;
