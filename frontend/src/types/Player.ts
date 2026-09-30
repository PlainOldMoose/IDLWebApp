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
    won: boolean;
    side: "RADIANT" | "DIRE";
    sub: boolean;
    eloChange: number | null; // null when the match has no ELO record
    seasonName: string | null;
}