import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import type {MatchSummary, PlayerDetail, PlayerSummary, Season, SeasonDetail, SeasonSignup, SteamUser} from "../types.ts";

// /api and /auth are same-origin: proxied by Vite in dev and by nginx in prod
const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(path, init);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${path}`);
    // 204 No Content has no body to parse
    return response.status === 204 ? undefined as T : response.json();
};

export function usePlayers() {
    return useQuery({
        queryKey: ["players"],
        queryFn: () => request<PlayerSummary[]>("/api/players"),
    });
}

export function usePlayer(steamId: string | undefined) {
    return useQuery({
        queryKey: ["player", steamId],
        queryFn: () => request<PlayerDetail>(`/api/players/${steamId}`),
        enabled: !!steamId
    })
}

export function useSeasons() {
    return useQuery({
        queryKey: ["seasons"],
        queryFn: () => request<Season[]>("/api/seasons"),
    });
}

export function useCreateSeason() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (season: Pick<Season, "name" | "startDate" | "endDate">) => request<Season>("/api/seasons", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(season),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["seasons"]});
        }
    });
}

export function useDeleteSeason() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (seasonId: string) => request<void>(`/api/seasons/${seasonId}`, {method: "DELETE"}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["seasons"]});
        }
    });
}

export function useMatches() {
    return useQuery({
        queryKey: ["matches"],
        queryFn: () => request<MatchSummary[]>("/api/matches"),
    });
}

// null when signed out
export function useCurrentUser() {
    return useQuery({
        queryKey: ["currentUser"],
        queryFn: () => request<SteamUser>("/auth/me").catch(() => null),
        retry: false,
    });
}

export function useSeasonDetail(seasonId: string | undefined) {
    return useQuery({
        queryKey: ["season", seasonId],
        queryFn: () => request<SeasonDetail>(`/api/seasons/${seasonId}`),
        enabled: !!seasonId
    });
}

export function useSeasonSignups(seasonId: string | undefined) {
    return useQuery({
        queryKey: ["seasonSignups", seasonId],
        queryFn: () => request<SeasonSignup[]>(`/api/seasons/${seasonId}/signups`),
    })
}

export function useSeasonSignup(seasonId: string | undefined) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: { rolePreference: string, willingToCaptain: boolean }) => request<SeasonSignup>(`/api/seasons/${seasonId}/signups`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["seasonSignups", seasonId]});
        }
    });
}

export function useSeasonMatches(seasonId: string | undefined, enabled: boolean) {
    return useQuery({
        queryKey: ["seasonMatches", seasonId],
        queryFn: () => request<MatchSummary[]>(`/api/matches?seasonId=${seasonId}`),
        enabled: enabled && !!seasonId
    });
}
