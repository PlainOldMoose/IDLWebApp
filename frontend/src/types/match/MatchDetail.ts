import type { MatchParticipant } from "./MatchParticipant";

export interface MatchDetail {
    matchId: number; 
    winner: "RADIANT" | "DIRE";
    timePlayed: string;
    scheduledTime: string;
    avgElo: number;
    seasonName?: string;
    radiantTeamName?: string;
    direTeamName?: string;
    participants: MatchParticipant[];
}