import {getAllPlayers} from "./Api.ts";
import {useQuery} from "@tanstack/react-query";

export function usePlayers() {
    return useQuery({
        queryKey: ["players"],
        queryFn: getAllPlayers,
    });
}