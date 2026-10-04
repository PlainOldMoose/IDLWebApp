import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import type {Inhouse, MatchDetail, MatchSummary, PlayerDetail, PlayerSummary, Season, SeasonDetail, SeasonSignup, SteamUser} from "../types.ts";

// /api and /auth are same-origin: proxied by Vite in dev and by nginx in prod. json, if given, is sent as the body
const request = async <T>(path: string, {json, ...init}: Omit<RequestInit, "body"> & { json?: unknown } = {}): Promise<T> => {
    // Spring's CSRF check wants the XSRF-TOKEN cookie echoed back as a header on writes
    const headers = new Headers(init.headers);
    const xsrfToken = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)?.[1];
    if (xsrfToken) headers.set("X-XSRF-TOKEN", decodeURIComponent(xsrfToken));
    if (json !== undefined) headers.set("Content-Type", "application/json");

    const response = await fetch(path, {...init, headers, body: JSON.stringify(json)});
    // Problem details (RFC 9457) carry the server's reason, e.g. "Username already exists"
    if (!response.ok) {
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.detail ?? `${response.status} ${response.statusText}: ${path}`);
    }
    return response.status === 204 ? undefined as T : response.json();
};

export function usePlayers(enabled = true) {
    return useQuery({
        queryKey: ["players"],
        queryFn: () => request<PlayerSummary[]>("/api/players"),
        enabled,
    });
}

export function usePlayer(steamId: string | undefined) {
    return useQuery({
        queryKey: ["player", steamId],
        queryFn: () => request<PlayerDetail>(`/api/players/${steamId}`),
        enabled: !!steamId
    })
}

export function useCreatePlayer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (player: PlayerSummary) =>
            request<PlayerSummary>("/api/players", {method: "POST", json: player}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["players"]});
        }
    });
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
        mutationFn: (season: Pick<Season, "name" | "startDate" | "endDate">) =>
            request<Season>("/api/seasons", {method: "POST", json: season}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["seasons"]});
        }
    });
}

export function useDeleteSeason(seasonId: string | undefined) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => request<void>(`/api/seasons/${seasonId}`, {method: "DELETE"}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["seasons"]});
        }
    });
}

// Every match, or only one season's
export function useMatches(seasonId?: string, enabled = true) {
    return useQuery({
        queryKey: ["matches", seasonId],
        queryFn: () => request<MatchSummary[]>(seasonId ? `/api/matches?seasonId=${seasonId}` : "/api/matches"),
        enabled,
    });
}

// A season game the league ticket missed. radiant and dire are Steam IDs. Everyone's ELO is replayed from the game on,
// so everything cached is stale
export function useCreateMatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (match: {
            matchId: number, seasonId: string, playedTime: string, radiantTeamId: string, direTeamId: string,
            winner: "RADIANT" | "DIRE", radiant: string[], dire: string[]
        }) => request<void>("/api/matches", {method: "POST", json: match}),
        onSuccess: () => {
            queryClient.invalidateQueries();
        }
    });
}

// ELO is replayed without the game, so everything cached is stale
export function useDeleteMatch(matchId: string | undefined) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => request<void>(`/api/matches/${matchId}`, {method: "DELETE"}),
        onSuccess: () => {
            queryClient.invalidateQueries();
        }
    });
}

export function useMatchDetail(matchId: string | undefined) {
    return useQuery({
        queryKey: ["match", matchId],
        queryFn: () => request<MatchDetail>(`/api/matches/${matchId}`),
        enabled: !!matchId
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

export function useSignOut() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => request<void>("/auth/logout", {method: "POST"}),
        onSuccess: () => {
            queryClient.setQueryData(["currentUser"], null);
        }
    });
}

export function useSeasonDetail(seasonId: string | undefined) {
    return useQuery({
        queryKey: ["season", seasonId],
        queryFn: () => request<SeasonDetail>(`/api/seasons/${seasonId}`),
        enabled: !!seasonId
    });
}

export function useSeasonSignups(seasonId: string | undefined, enabled: boolean) {
    return useQuery({
        queryKey: ["seasonSignups", seasonId],
        queryFn: () => request<SeasonSignup[]>(`/api/seasons/${seasonId}/signups`),
        enabled: enabled && !!seasonId
    })
}

export function useSeasonSignup(seasonId: string | undefined) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: { rolePreference: string, willingToCaptain: boolean }) =>
            request<SeasonSignup>(`/api/seasons/${seasonId}/signups`, {method: "POST", json: body}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["seasonSignups", seasonId]});
        }
    });
}

// Removes the signed-in player's own sign-up
export function useWithdrawSignup(seasonId: string | undefined) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => request<void>(`/api/seasons/${seasonId}/signups`, {method: "DELETE"}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["seasonSignups", seasonId]});
        }
    });
}

// In-houses whose result isn't in yet, newest first
export function useInhouses() {
    return useQuery({
        queryKey: ["inhouses"],
        queryFn: () => request<Inhouse[]>("/api/inhouses"),
    });
}

// Reported results waiting for an admin, oldest first. Admin-only; under ["inhouses"] so the same invalidations refresh it
export function usePendingInhouses(enabled: boolean) {
    return useQuery({
        queryKey: ["inhouses", "pending"],
        queryFn: () => request<Inhouse[]>("/api/inhouses/pending"),
        enabled,
    });
}

// The 3 most even ways to split 10 players, most even first
export function useInhouseBalance(steamIds: string[]) {
    return useQuery({
        queryKey: ["inhouseBalance", steamIds],
        queryFn: () => request<Inhouse[]>(`/api/inhouses/balance?players=${steamIds.join(",")}`),
        enabled: steamIds.length === 10,
    });
}

export function useCreateInhouse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (teams: { teamA: string[], teamB: string[] }) =>
            request<Inhouse>("/api/inhouses", {method: "POST", json: teams}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["inhouses"]});
        }
    });
}

// Sends the winning side and Team A's side to the admin queue; nobody's ELO moves yet
export function useInhouseResult() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id, teamASide, winner}: { id: number, teamASide: "RADIANT" | "DIRE", winner: "RADIANT" | "DIRE" }) =>
            request<void>(`/api/inhouses/${id}/result?teamASide=${teamASide}&winner=${winner}`, {method: "POST"}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["inhouses"]});
        }
    });
}

// The match is recorded under the in-house's ID. ELO moves for all 10 players, so everything cached is stale
export function useApproveInhouse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => request<void>(`/api/inhouses/${id}/approve`, {method: "POST"}),
        onSuccess: () => {
            queryClient.invalidateQueries();
        }
    });
}

export function useCancelInhouse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => request<void>(`/api/inhouses/${id}`, {method: "DELETE"}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["inhouses"]});
        }
    });
}
