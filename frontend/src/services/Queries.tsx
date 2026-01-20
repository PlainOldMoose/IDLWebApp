import { useQuery } from "@tanstack/react-query";
import {
  getAllMatches,
  getAllPlayers,
  getAllSeasons,
  getFilteredMatches,
  getMatchDetail,
  getPlayerDetail,
  getSeasonDetail,
  getUpcomingMatches,
  getActiveSeason,
} from "./Api";

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

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: getAllMatches,
  });
}

export function useSeasons() {
  return useQuery({
    queryKey: ["seasons"],
    queryFn: getAllSeasons,
  });
}

export function useSeasonDetail(seasonId: string | undefined) {
  return useQuery({
    queryKey: ["season", seasonId],
    queryFn: () => getSeasonDetail(seasonId!),
    enabled: !!seasonId,
  });
}

export function useMatchDetail(matchId: number | undefined) {
  return useQuery({
    queryKey: ["match", matchId],
    queryFn: () => getMatchDetail(matchId!),
    enabled: !!matchId,
  });
}

export function useFilteredMatches(
  seasonId?: string,
  teamId?: string,
  playerSteamId?: string,
) {
  return useQuery({
    queryKey: ["matches", seasonId, teamId, playerSteamId],
    queryFn: () => getFilteredMatches(seasonId, teamId, playerSteamId),
  });
}

export function useUpcomingMatches(limit: number = 5) {
  return useQuery({
    queryKey: ["matches", "upcoming", limit],
    queryFn: () => getUpcomingMatches(limit),
  });
}

export function useActiveSeason() {
  return useQuery({
    queryKey: ["seasons", "active"],
    queryFn: getActiveSeason,
  });
}
