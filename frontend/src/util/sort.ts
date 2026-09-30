import type {PlayerSummary} from "../types/Player.ts";

// The API returns players unordered; rank is position by ELO
export const rankPlayers = (players: PlayerSummary[]): PlayerSummary[] =>
    [...players].sort((a, b) => b.elo - a.elo);

// The API returns matches unordered
export const newestFirst = <T extends { timePlayed: string }>(matches: T[]): T[] =>
    [...matches].sort((a, b) => b.timePlayed.localeCompare(a.timePlayed));
