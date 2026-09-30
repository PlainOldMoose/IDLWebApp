export interface SeasonDetail {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: "REGISTRATION" | "ACTIVE" | "COMPLETED";
    teams: TeamSummary[]
    winnerTeamName?: string;
}

export interface TeamSummary {
    teamId: string,
    name: string,
    captainUsername: string,
    members: Member[],
    avgElo: number;
    wins: number;
    losses: number;
    winrate: number;
}

export interface Member {
    steamId: string,
    username: string,
    elo: number,
}