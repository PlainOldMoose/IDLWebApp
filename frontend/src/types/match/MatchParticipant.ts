export interface MatchParticipant {
    steamId: string;
    username: string;
    eloAtMatchTime: number;
    side: "RADIANT" | "DIRE";
    eloChange: number;
    isSub: boolean;
    subbingForSteamId?: string;
    subbingForUsername?: string;
}