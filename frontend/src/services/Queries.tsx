import { useQuery } from "@tanstack/react-query";
import { getAllPlayers, getMatches, getPlayerDetail } from "./Api";

export function useMatchIds() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: getMatches,
  });
}

export function usePlayers() {
  return useQuery({
    queryKey: ["players"],
    queryFn: getAllPlayers,
  });
}

export function usePlayerDetail(steamId: string | undefined) {
  return useQuery({
    queryKey: ["player", steamId],
    queryFn: () => getPlayerDetail(steamId!),
    enabled: !!steamId,
  });
}
