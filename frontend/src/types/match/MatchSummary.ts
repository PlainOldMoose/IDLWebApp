export interface Match {
  matchId: number;
  winner: "RADIANT" | "DIRE";
  timePlayed: string;
  avgElo?: number;
  seasonName?: string;
}
