export interface MatchParticipant {
    steamId: string;
    username: string;
    currentElo: number;
    side: "RADIANT" | "DIRE";
    eloChange: number;
    isSub: boolean;
    subbingForSteamId?: string;
    subbingForUsername?: string;
}