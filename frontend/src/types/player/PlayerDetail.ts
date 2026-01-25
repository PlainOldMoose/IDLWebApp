import type { RecentMatch } from "./RecentMatch";

export interface PlayerDetail {
  steamId: string;
  username: string;
  elo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  eloHistory: number[];
  recentMatches: RecentMatch[];
}