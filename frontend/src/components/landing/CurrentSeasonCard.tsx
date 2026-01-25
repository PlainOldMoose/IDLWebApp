import { Link } from "react-router-dom";
import type { SeasonDetail } from "../../types/season/SeasonDetail";

interface CurrentSeasonCardProps {
  season: SeasonDetail;
}

export default function CurrentSeasonCard({ season }: CurrentSeasonCardProps) {
  const calculateProgress = () => {
    if (!season.startDate || !season.endDate) return 0;

    const start = new Date(season.startDate).getTime();
    const end = new Date(season.endDate).getTime();
    const now = Date.now();

    if (now < start) return 0;
    if (now > end) return 100;

    return Math.round(((now - start) / (end - start)) * 100);
  };

  const calculateDaysRemaining = () => {
    if (!season.endDate) return null;

    const end = new Date(season.endDate).getTime();
    const now = Date.now();
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    return days > 0 ? days : 0;
  };

  const getTotalPlayers = () => {
    return season.teams.reduce((total, team) => total + team.members.length, 0);
  };

  const getTotalMatches = () => {
    return season.teams.reduce((total, team) => total + team.wins + team.losses, 0) / 2;
  };

  const progress = calculateProgress();
  const daysRemaining = calculateDaysRemaining();

  return (
    <div className="current-season-card">
      <div className="current-season-header">
        <Link to={`/seasons/${season.id}`} className="current-season-link">
          <h3>{season.name}</h3>
        </Link>
        <span className={`season-status season-status--${season.status.toLowerCase()}`}>
          {season.status}
        </span>
      </div>

      <div className="season-progress-container">
        <div className="season-progress-bar">
          <div
            className="season-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="season-progress-text">{progress}% Complete</span>
      </div>

      <div className="current-season-stats">
        <div className="current-season-stat">
          <span className="stat-value">{season.teams.length}</span>
          <span className="stat-label">Teams</span>
        </div>
        <div className="current-season-stat">
          <span className="stat-value">{getTotalMatches()}</span>
          <span className="stat-label">Matches</span>
        </div>
        <div className="current-season-stat">
          <span className="stat-value">{getTotalPlayers()}</span>
          <span className="stat-label">Players</span>
        </div>
        <div className="current-season-stat">
          <span className="stat-value">{daysRemaining ?? "-"}</span>
          <span className="stat-label">Days Left</span>
        </div>
      </div>
    </div>
  );
}
