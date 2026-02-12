import axios from "axios";
import type {PlayerSummary} from "../types/Player.ts";
import type {Season} from "../types/Season.ts";
import type {MatchSummary} from "../types/Match.ts";
import type {SteamUser} from "../types/SteamUser.ts";
import type {SeasonDetail} from "../types/SeasonDetail.ts";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:8080/auth";
const axiosInstance = axios.create({baseURL: BASE_URL, withCredentials: true});

export const getAllPlayers = async (): Promise<PlayerSummary[]> => {
    const response = await axiosInstance.get<PlayerSummary[]>("players");
    return response.data;
}

export const getAllSeasons = async (): Promise<Season[]> => {
    const response = await axiosInstance.get<Season[]>("seasons");
    return response.data;
}

export const getAllMatches = async (): Promise<MatchSummary[]> => {
    const response = await axiosInstance.get<MatchSummary[]>("matches");
    return response.data;
}

export const getCurrentUser = async (): Promise<SteamUser | null> => {
    try {
        const response = await axios.get<SteamUser>(`${AUTH_URL}/me`, {withCredentials: true});
        return response.data;
    } catch {
        return null;
    }
}

export const getSeasonDetail = async (seasonId: string): Promise<SeasonDetail> => {
    const response = await axiosInstance.get<SeasonDetail>(`seasons/${seasonId}`);
    return response.data;
}