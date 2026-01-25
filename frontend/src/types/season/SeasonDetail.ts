export interface SeasonDetail {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "REGISTRATION" | "ACTIVE" | "COMPLETED";
  teams: SeasonTeam[];
}

export interface SeasonTeam {
  teamId: string;
  teamName: string;
  captainSteamId: string;
  captainUsername: string;
  members: TeamMember[];
  avgElo: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface TeamMember {
  steamId: string;
  username: string;
  currentElo: number;
}
