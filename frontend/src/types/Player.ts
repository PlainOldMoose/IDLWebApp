export interface PlayerSummary {
    steamId: string;
    username: string;
    elo: number;
}

export interface PlayerDetail {
    steamId: string;
    username: string;
    elo: number;
    wins: number;
    losses: number;
    winRate: number;
    recentMatches: PlayerMatchSummary[]
}

export type PlayerMatchSummary = {
    matchId: number;
    timePlayed: string;
    won: boolean
    eloChange: number
    seasonName: string;
}