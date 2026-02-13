import {
    getAllMatches, getAllPlayers, getAllSeasons, getCurrentUser, getSeasonDetail, getSeasonMatches, getSeasonSignups,
    postSeasonSignup
} from "./Api.ts";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function usePlayers() {
    return useQuery({
        queryKey: ["players"],
        queryFn: getAllPlayers,
    });
}

export function useSeasons() {
    return useQuery({
        queryKey: ["seasons"],
        queryFn: getAllSeasons,
    });
}

export function useMatches() {
    return useQuery({
        queryKey: ["matches"],
        queryFn: getAllMatches,
    });
}

export function useCurrentUser() {
    return useQuery({
        queryKey: ["currentUser"],
        queryFn: getCurrentUser,
        retry: false,
    });
}

export function useSeasonDetail(seasonId: string | undefined) {
    return useQuery({
        queryKey: ["season", seasonId],
        queryFn: () => getSeasonDetail(seasonId!),
        enabled: !!seasonId
    });
}

export function useSeasonSignups(seasonId: string | undefined) {
    return useQuery({
        queryKey: ["seasonSignups", seasonId],
        queryFn: () => getSeasonSignups(seasonId!),
    })
}

export function useSeasonSignup(seasonId: string | undefined) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (willingToCaptain: boolean) => postSeasonSignup(seasonId!, willingToCaptain),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["seasonSignups", seasonId]});
        }
    });
}

export function useSeasonMatches(seasonId: string | undefined, enabled: boolean) {
    return useQuery({
        queryKey: ["seasonMatches", seasonId],
        queryFn: () => getSeasonMatches(seasonId),
        enabled: enabled && !!seasonId
    });

}