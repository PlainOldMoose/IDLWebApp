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
    status: "REGISTRATION" | "DRAFTING" | "ACTIVE" | "COMPLETED";
}

export interface SeasonDetail extends Season {
    teams: TeamSummary[]; // In table order: most wins, then fewest losses
    winnerTeamName?: string;
    leagueId?: number | null; // The Dota league ticket the sync pulls games from
}

// A match in a season's "Recently deleted" bin, admin-only. Times are local, like every other time from the API
export interface BinMatch {
    matchId: number;
    radiantTeamName: string | null;
    direTeamName: string | null;
    winner: "RADIANT" | "DIRE";
    deletedAt: string;
    purgeAt: string; // When it's cleared for good, a week after deletedAt
}

// A season's league sync, admin-only: the last run, and the ticketed games that couldn't go in on their own
export interface LeagueSync {
    syncedAt: string | null;
    error: string | null; // Why the last sync failed; null once one works
    pending: PendingMatch[];
}

export interface PendingMatch {
    matchId: number;
    playedTime: string;
    winner: "RADIANT" | "DIRE" | null; // null when OpenDota never got the game, so only the admin knows
    radiantTeamId: string | null; // The sync's guess; null when no team had a majority of the side
    direTeamId: string | null;
    radiant: PendingPlayer[]; // Public profiles only; the private ones are just counted
    dire: PendingPlayer[];
    reason: string;
}

interface PendingPlayer {
    steamId: string;
    username: string | null; // null when the account isn't a registered player
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
    sub: boolean;
}

export interface DraftPlayer {
    steamId: string;
    username: string;
    elo: number;
    draftScore: number;
    rolePreference: string | null;
    willingToCaptain: boolean;
}

export interface DraftTeam {
    teamId: string;
    name: string;
    captainSteamId: string;
    members: DraftPlayer[]; // Captain first, then highest score first
    draftScore: number; // Sum of the members' scores
}

export interface Draft {
    pool: DraftPlayer[]; // Highest score first
    teams: DraftTeam[];
    onTheClockTeamId: string | null; // null until every team has a captain
    teamCount: number;
}

export interface MatchSummary {
    matchId: number;
    winner: "RADIANT" | "DIRE";
    timePlayed: string;
    avgElo: number | null; // null unless all 10 players have a recorded ELO for the match
    seasonId?: string; // Not set for in-houses
    seasonName?: string;
    radiantTeamName?: string;
    direTeamName?: string;
}

export interface MatchDetail {
    match: MatchSummary;
    players: MatchPlayer[]; // By ELO going in, highest first
    radiantStanding: TeamStanding | null; // null for an in-house
    direStanding: TeamStanding | null;
    radiantWinChance: number | null; // 0 to 1, from the ELO going in; null unless every player has an ELO record
    source: "API_SYNC" | "MANUAL"; // Whether the league sync added it, or an admin (or an in-house)
}

// Where a team stood in its season going into a match
interface TeamStanding {
    position: number; // 1 for first
    teamCount: number;
    wins: number;
    losses: number;
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
    teamASide: "RADIANT" | "DIRE" | null;
    reportedBy: string | null; // the reporter's username
    eloChanges: Record<string, number> | null; // Steam ID to what approving the result would do to their ELO; only the admin queue has these
}
