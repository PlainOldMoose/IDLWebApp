export interface PlayerSummary {
  steamId: string;
  username: string;
  elo: number;
  rank: number;
  matchesPlayed: number;
  winRate: number;
}

export interface MatchShort {
  matchId: number;
  playedAt: string;
  won: boolean;
  eloChange: number;
  seasonName: string | null;
  heroId?: number; // Placeholder for hero icon
  kda?: string;
}

export interface PlayerDetail extends PlayerSummary {
  wins: number;
  losses: number;
  recentMatches: MatchShort[];
  eloHistory: { date: string; elo: number }[];
  mostPlayedRole: 'Core' | 'Support' | 'Flex';
}

export const MatchType = {
  Casual: 0,
  Season: 1
} as const;
export type MatchType = typeof MatchType[keyof typeof MatchType];

export const WinnerSide = {
  Radiant: 0,
  Dire: 1
} as const;
export type WinnerSide = typeof WinnerSide[keyof typeof WinnerSide];

export interface TeamPlayer {
  steamId: string;
  username: string;
  heroId?: number;
}

export interface Match {
  id: number;
  date: string;
  duration: string;
  type: MatchType;
  seasonId?: string;
  seasonName?: string;
  winner: WinnerSide;
  radiantScore: number;
  direScore: number;
  radiantTeam: TeamPlayer[];
  direTeam: TeamPlayer[];
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Upcoming';
  prizePool?: string;
  teams: { name: string; captain: string; wins: number; losses: number }[];
}
