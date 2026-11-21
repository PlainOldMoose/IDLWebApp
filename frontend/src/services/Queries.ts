import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import type {BinMatch, Draft, Inhouse, LeagueSync, MatchDetail, MatchSummary, PlayerDetail, PlayerSummary, Season, SeasonDetail, SeasonSignup, SteamUser} from "../types.ts";

// /api and /auth are same-origin: proxied by Vite in dev and by nginx in prod
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
    // Writes answer 201/204 with no body
    const text = await response.text();
    return text ? JSON.parse(text) : undefined as T;
};

export function usePlayers(enabled = true, includeDisabled = false) {
    return useQuery({
        queryKey: ["players", includeDisabled],
        queryFn: () => request<PlayerSummary[]>(includeDisabled ? "/api/players?includeDisabled=true" : "/api/players"),
        enabled,
        // Keeps the list on screen while the admin toggle swaps it, instead of flashing the loader
        placeholderData: keepPreviousData,
    });
}

export function usePlayer(steamId: string | undefined) {
    return useQuery({
        queryKey: ["player", steamId],
        queryFn: () => request<PlayerDetail>(`/api/players/${encodeURIComponent(steamId ?? "")}`),
        enabled: !!steamId
    })
}

// Invalidates queryKeys on success, or everything cached when none are given. It doesn't return the invalidation, so
// mutations settle (and their callers navigate or close dialogs) without waiting for the refetch
function useApiMutation<V = void, T = void>(mutationFn: (variables: V) => Promise<T>, ...queryKeys: unknown[][]) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: () => {
            if (queryKeys.length === 0) void queryClient.invalidateQueries();
            queryKeys.forEach(queryKey => void queryClient.invalidateQueries({queryKey}));
        },
    });
}

export function useCreatePlayer() {
    return useApiMutation(
        (player: Omit<PlayerSummary, "disabled">) =>
            request<PlayerSummary>("/api/players", {method: "POST", json: player}),
        ["players"],
    );
}

export function useSetDisabled(steamId: string) {
    return useApiMutation(
        (disabled: boolean) =>
            request<void>(`/api/players/${encodeURIComponent(steamId)}/disabled`, {method: disabled ? "PUT" : "DELETE"}),
        ["players"],
        ["player", steamId],
    );
}

export function useSeasons() {
    return useQuery({
        queryKey: ["seasons"],
        queryFn: () => request<Season[]>("/api/seasons"),
    });
}

export function useCreateSeason() {
    return useApiMutation(
        (season: Pick<Season, "name" | "startDate" | "endDate">) =>
            request<Season>("/api/seasons", {method: "POST", json: season}),
        ["seasons"],
    );
}

export function useDeleteSeason(seasonId: string | undefined) {
    return useApiMutation(() => request<void>(`/api/seasons/${seasonId}`, {method: "DELETE"}), ["seasons"]);
}

export function useCompleteSeason(seasonId: string | undefined) {
    return useApiMutation(
        (winnerTeamId: string) =>
            request<void>(`/api/seasons/${seasonId}/complete`, {method: "POST", json: {winnerTeamId}}),
        ["season", seasonId],
        ["seasons"],
    );
}

// Admin-only, so only admins ask; under ["season", id] so the season's own invalidations refresh it
export function useLeagueSync(seasonId: string | undefined, enabled: boolean) {
    return useQuery({
        queryKey: ["season", seasonId, "league"],
        queryFn: () => request<LeagueSync>(`/api/seasons/${seasonId}/league`),
        enabled: !!seasonId && enabled,
    });
}

export function useSetLeague(seasonId: string | undefined) {
    return useApiMutation(
        (leagueId: number | null) => request<void>(`/api/seasons/${seasonId}/league`, {method: "PUT", json: {leagueId}}),
        ["season", seasonId],
    );
}

// Imported games replay everyone's ELO, and a failure is recorded on the season, so everything is stale either way
export function useSyncLeague(seasonId: string | undefined) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => request<void>(`/api/seasons/${seasonId}/league/sync`, {method: "POST"}),
        onSettled: () => void queryClient.invalidateQueries(),
    });
}

export function useRejectPendingMatch(seasonId: string | undefined) {
    return useApiMutation(
        (matchId: number) => request<void>(`/api/seasons/${seasonId}/league/pending/${matchId}`, {method: "DELETE"}),
        ["season", seasonId, "league"],
    );
}

export function useMatches(seasonId?: string, enabled = true) {
    return useQuery({
        queryKey: ["matches", seasonId],
        queryFn: () => request<MatchSummary[]>(seasonId ? `/api/matches?seasonId=${seasonId}` : "/api/matches"),
        enabled,
    });
}

// The latest few matches, newest first, without fetching the rest
export function useRecentMatches(limit: number) {
    return useQuery({
        queryKey: ["matches", "recent", limit],
        queryFn: () => request<MatchSummary[]>(`/api/matches?limit=${limit}`),
    });
}

// Everyone's ELO is replayed from the game on, so everything cached is stale
export function useCreateMatch() {
    return useApiMutation(
        (match: {
            matchId: number, seasonId: string, playedTime: string, radiantTeamId: string, direTeamId: string,
            winner: "RADIANT" | "DIRE", radiant: string[], dire: string[], subbingFor: Record<string, string>
        }) => request<void>("/api/matches", {method: "POST", json: match}),
    );
}

// Moves the season table, so everything cached is stale
export function useCreateForfeit() {
    return useApiMutation(
        (forfeit: {seasonId: string, playedTime: string, forfeitingTeamId: string, opponentTeamId: string}) =>
            request<void>("/api/matches/forfeits", {method: "POST", json: forfeit}),
    );
}

// A season's "Recently deleted" bin. Admin-only, so only admins ask
export function useMatchBin(seasonId: string | undefined, enabled: boolean) {
    return useQuery({
        queryKey: ["matches", "bin", seasonId],
        queryFn: () => request<BinMatch[]>(`/api/matches/bin?seasonId=${seasonId}`),
        enabled: !!seasonId && enabled,
    });
}

// Back in with ELO replayed from the game on, so everything cached is stale
export function useRestoreMatch() {
    return useApiMutation((matchId: number) => request<void>(`/api/matches/${matchId}/restore`, {method: "POST"}));
}

// ELO is replayed without the game, so everything cached is stale
export function useDeleteMatch(matchId: string | undefined) {
    return useApiMutation(() => request<void>(`/api/matches/${matchId}`, {method: "DELETE"}));
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

export function useSeasonSignups(seasonId: string | undefined) {
    return useQuery({
        queryKey: ["seasonSignups", seasonId],
        queryFn: () => request<SeasonSignup[]>(`/api/seasons/${seasonId}/signups`),
        enabled: !!seasonId
    })
}

export function useSeasonSignup(seasonId: string | undefined) {
    return useApiMutation(
        (body: { rolePreference: string | null, willingToCaptain: boolean, sub: boolean }) =>
            request<SeasonSignup>(`/api/seasons/${seasonId}/signups`, {method: "POST", json: body}),
        ["seasonSignups", seasonId],
    );
}

export function useWithdrawSignup(seasonId: string | undefined) {
    return useApiMutation(
        () => request<void>(`/api/seasons/${seasonId}/signups`, {method: "DELETE"}),
        ["seasonSignups", seasonId],
    );
}

// Polled, so everyone watching sees each pick without refreshing
export function useDraft(seasonId: string | undefined, enabled = true) {
    return useQuery({
        queryKey: ["draft", seasonId],
        queryFn: () => request<Draft>(`/api/seasons/${seasonId}/draft`),
        enabled: !!seasonId && enabled,
        refetchInterval: 5000,
    });
}

// Closes sign-ups, scores everyone and makes the first willing captains captain
export function useStartDraft(seasonId: string | undefined) {
    return useApiMutation(
        () => request<void>(`/api/seasons/${seasonId}/draft`, {method: "POST"}),
        ["season", seasonId],
        ["seasons"],
        ["seasonSignups", seasonId],
    );
}

export function useDraftPick(seasonId: string) {
    return useApiMutation(
        (steamId: string) =>
            request<void>(`/api/seasons/${seasonId}/draft/picks`, {method: "POST", json: {steamId}}),
        ["draft", seasonId],
    );
}

// Locks the team names; matches can be added from here
export function useStartSeason(seasonId: string | undefined) {
    return useApiMutation(
        () => request<void>(`/api/seasons/${seasonId}/draft/start`, {method: "POST"}),
        ["season", seasonId],
        ["seasons"],
    );
}

export function useDraftCaptain(seasonId: string) {
    return useApiMutation(
        ({steamId, captain}: { steamId: string, captain: boolean }) =>
            request<void>(`/api/seasons/${seasonId}/draft/captains/${steamId}`, {method: captain ? "PUT" : "DELETE"}),
        ["draft", seasonId],
    );
}

export function useRenameTeam(seasonId: string) {
    return useApiMutation(
        ({teamId, name}: { teamId: string, name: string }) =>
            request<void>(`/api/seasons/${seasonId}/draft/teams/${teamId}`, {method: "PUT", json: {name}}),
        ["draft", seasonId],
    );
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

export function useInhouseBalance(steamIds: string[]) {
    return useQuery({
        queryKey: ["inhouseBalance", steamIds],
        queryFn: () => request<Inhouse[]>(`/api/inhouses/balance?players=${steamIds.join(",")}`),
        enabled: steamIds.length === 10,
    });
}

export function useCreateInhouse() {
    return useApiMutation(
        (teams: { teamA: string[], teamB: string[] }) =>
            request<Inhouse>("/api/inhouses", {method: "POST", json: teams}),
        ["inhouses"],
    );
}

// Sends the winning side and Team A's side to the admin queue; nobody's ELO moves yet
export function useInhouseResult() {
    return useApiMutation(
        ({id, teamASide, winner}: { id: number, teamASide: "RADIANT" | "DIRE", winner: "RADIANT" | "DIRE" }) =>
            request<void>(`/api/inhouses/${id}/result?teamASide=${teamASide}&winner=${winner}`, {method: "POST"}),
        ["inhouses"],
    );
}

// The match is recorded under the in-house's ID. ELO moves for all 10 players, so everything cached is stale
export function useApproveInhouse() {
    return useApiMutation((id: number) => request<void>(`/api/inhouses/${id}/approve`, {method: "POST"}));
}

export function useCancelInhouse() {
    return useApiMutation((id: number) => request<void>(`/api/inhouses/${id}`, {method: "DELETE"}), ["inhouses"]);
}
