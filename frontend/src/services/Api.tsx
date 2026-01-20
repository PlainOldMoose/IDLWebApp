import axios from "axios";
import type { PlayerDetail, PlayerSummary } from "../types/Player";
import type { Match } from "../types/Match";

const BASE_URL = "http://localhost:8080/api";
const axiosInstance = axios.create({ baseURL: BASE_URL });

export const getMatches = async () => {
  return (await axiosInstance.get<Match[]>("matches")).data.map(
    (match) => match.matchId,
  );
};

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
