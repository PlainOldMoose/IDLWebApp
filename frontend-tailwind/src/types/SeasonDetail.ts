export interface SeasonDetail {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    teams: TeamSummary[]
}

export interface TeamSummary {
    teamId: string,
    teamName: string,
    captainUsername: string,
    avgElo: number;
    wins: number;
    losses: number;
    winrate: number;
}