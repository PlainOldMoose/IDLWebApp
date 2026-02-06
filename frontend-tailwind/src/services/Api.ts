import axios from "axios";
import type {PlayerSummary} from "../types/Player.ts";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const axiosInstance = axios.create({baseURL: BASE_URL, withCredentials: true});

export const getAllPlayers = async (): Promise<PlayerSummary[]> => {
    const response = await axiosInstance.get<PlayerSummary[]>("players");
    return response.data;
}