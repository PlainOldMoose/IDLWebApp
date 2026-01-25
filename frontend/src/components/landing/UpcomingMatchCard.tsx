import type { UpcomingMatch } from "../../types/match/UpcomingMatch";

interface UpcomingMatchCardProps {
  match: UpcomingMatch;
}

export default function UpcomingMatchCard({ match }: UpcomingMatchCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="upcoming-match-card">
      <div className="upcoming-match-time">
        {match.scheduledTime ? formatDate(match.scheduledTime) : "TBD"}
      </div>
      <div className="upcoming-match-teams">
        <div className="upcoming-team upcoming-team--radiant">
          <span className="team-name">{match.radiantTeamName || "TBD"}</span>
          <span className="team-elo">{match.radiantTeamAvgElo} ELO</span>
        </div>
        <div className="upcoming-vs">VS</div>
        <div className="upcoming-team upcoming-team--dire">
          <span className="team-name">{match.direTeamName || "TBD"}</span>
          <span className="team-elo">{match.direTeamAvgElo} ELO</span>
        </div>
      </div>
    </div>
  );
}
