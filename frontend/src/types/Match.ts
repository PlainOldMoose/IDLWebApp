export interface MatchSummary {
    matchId: number;
    winner: "RADIANT" | "DIRE";
    timePlayed: string;
    avgElo?: number;
    seasonName?: string;
    radiantTeamName?: string;
    direTeamName?: string;
}