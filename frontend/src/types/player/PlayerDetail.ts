import type { RecentMatch } from "./RecentMatch";
import type {EloSnapshot} from "./EloSnapshot.ts";

export interface PlayerDetail {
  steamId: string;
  username: string;
  elo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  eloSnapshotHistory: EloSnapshot[];
  recentMatches: RecentMatch[];
}