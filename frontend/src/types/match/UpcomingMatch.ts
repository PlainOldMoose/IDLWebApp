export interface UpcomingMatch {
  matchId: number;
  scheduledTime: string;
  seasonName: string | null;
  radiantTeamName: string | null;
  direTeamName: string | null;
  radiantTeamAvgElo: number;
  direTeamAvgElo: number;
}
