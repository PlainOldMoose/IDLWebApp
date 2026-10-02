export interface PlayerSummary {
    steamId: string;
    username: string;
    elo: number;
}

export interface PlayerDetail extends PlayerSummary {
    wins: number;
    losses: number;
    winRate: number;
    recentMatches: PlayerMatchSummary[];
}

interface PlayerMatchSummary {
    matchId: number;
    timePlayed: string;
    won: boolean;
    side: "RADIANT" | "DIRE";
    sub: boolean;
    eloChange: number | null; // null when the match has no ELO record
    seasonName: string | null;
}

export type SteamUser = Pick<PlayerSummary, "steamId" | "username"> & {admin: boolean};

export interface Season {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: "REGISTRATION" | "ACTIVE" | "COMPLETED";
}

export interface SeasonDetail extends Season {
    teams: TeamSummary[];
    winnerTeamName?: string;
}

interface TeamSummary {
    teamId: string;
    name: string;
    captainUsername: string;
    members: PlayerSummary[];
    avgElo: number;
    wins: number;
    losses: number;
}

export interface SeasonSignup {
    steamId: string;
    username: string;
    rolePreference: string | null;
    willingToCaptain: boolean;
    signedUpAt: string;
}

export interface MatchSummary {
    matchId: number;
    winner: "RADIANT" | "DIRE";
    timePlayed: string;
    avgElo: number;
    seasonName?: string;
    radiantTeamName?: string;
    direTeamName?: string;
}

export interface MatchDetail {
    match: MatchSummary;
    players: MatchPlayer[]; // By ELO going in, highest first
}

interface MatchPlayer {
    steamId: string;
    username: string;
    side: "RADIANT" | "DIRE";
    sub: boolean;
    subbingFor: string | null;
    eloBefore: number | null; // null when the match has no ELO record
    eloChange: number | null;
}

export interface Inhouse {
    id: number | null; // null for a balance option nobody has picked yet
    createdAt: string | null;
    teamA: PlayerSummary[]; // Highest ELO first
    teamB: PlayerSummary[];
    reportedWinner: "RADIANT" | "DIRE" | null; // null until someone reports the result; only the admin queue has these
    teamASide: "RADIANT" | "DIRE" | null; // the side Team A played, reported with the result
    reportedBy: string | null; // the reporter's username
}
