import axios from "axios";
import type { Match } from "../types/match/MatchSummary";
import type { UpcomingMatch } from "../types/match/UpcomingMatch";
import type { Season } from "../types/season/Season";
import type { PlayerSummary } from "../types/player/PlayerSummary";
import type { PlayerDetail } from "../types/player/PlayerDetail";
import type { MatchDetail } from "../types/match/MatchDetail";
import type { SeasonDetail } from "../types/season/SeasonDetail";
import type { CreateSeasonRequest } from "../types/season/CreateSeasonRequest";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const axiosInstance = axios.create({ baseURL: BASE_URL, withCredentials: true });

export const getAllPlayers = async (): Promise<PlayerSummary[]> => {
  const response = await axiosInstance.get<PlayerSummary[]>("players");
  return response.data;
};

export const getPlayerDetail = async (
  steamId: string,
): Promise<PlayerDetail> => {
  const response = await axiosInstance.get<PlayerDetail>(`players/${steamId}`);
  return response.data;
};

export const getAllMatches = async (): Promise<Match[]> => {
  const response = await axiosInstance.get<Match[]>("matches");
  return response.data;
};

export const getAllSeasons = async (): Promise<Season[]> => {
  const response = await axiosInstance.get<Season[]>("seasons");
  return response.data;
};

export const getSeasonDetail = async (
  seasonId: string,
): Promise<SeasonDetail> => {
  const response = await axiosInstance.get<SeasonDetail>(`seasons/${seasonId}`);
  return response.data;
};

export const getMatchDetail = async (matchId: number): Promise<MatchDetail> => {
  const response = await axiosInstance.get<MatchDetail>(`matches/${matchId}`);
  return response.data;
};

export const getFilteredMatches = async (
  seasonId?: string,
  teamId?: string,
  playerSteamId?: string,
): Promise<Match[]> => {
  const params = new URLSearchParams();
  if (seasonId) params.append("seasonId", seasonId);
  if (teamId) params.append("teamId", teamId);
  if (playerSteamId) params.append("playerSteamId", playerSteamId);

  const queryString = params.toString();
  const endpoint = queryString ? `matches?${queryString}` : "matches";
  const response = await axiosInstance.get<Match[]>(endpoint);
  return response.data;
};

export const getUpcomingMatches = async (
  limit: number = 5,
): Promise<UpcomingMatch[]> => {
  const response = await axiosInstance.get<UpcomingMatch[]>(
    `matches/upcoming?limit=${limit}`,
  );
  return response.data;
};

export const getActiveSeason = async (): Promise<SeasonDetail | null> => {
  const response = await axiosInstance.get<SeasonDetail | null>(
    "seasons/active",
  );
  return response.data;
};

export const createSeason = async (
  request: CreateSeasonRequest,
): Promise<Season> => {
  const response = await axiosInstance.post<Season>("seasons", request);
  return response.data;
};
