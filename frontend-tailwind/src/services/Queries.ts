import {getAllMatches, getAllPlayers, getAllSeasons, getCurrentUser} from "./Api.ts";
import {useQuery} from "@tanstack/react-query";

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