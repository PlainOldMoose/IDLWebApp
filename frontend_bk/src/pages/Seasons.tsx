import { useEffect, useState, useMemo } from "react";
import { Calendar, Award, Users } from "lucide-react";

interface Team {
  teamName: string;
  captainName?: string;
  wins?: number;
  losses?: number;
}

interface Season {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  prizePool?: string;
  teams: Team[];
}

function Seasons() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8080/api/seasons")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setSeasons(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const active = seasons.filter((s) => s.status === "ACTIVE").length;
    const completed = seasons.filter((s) => s.status === "COMPLETED").length;
    const totalTeams = seasons.reduce(
      (sum, s) => sum + (s.teams?.length || 0),
      0,
    );
    return { total: seasons.length, active, completed, totalTeams };
  }, [seasons]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "status-badge-active";
      case "COMPLETED":
        return "status-badge-completed";
      case "DRAFT":
        return "status-badge-draft";
      case "REGISTRATION":
        return "status-badge-registration";
      default:
        return "status-badge-default";
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="alert alert-danger">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header-section">
        <div>
          <h1 className="page-title">
            <Calendar className="text-accent" size={32} />
            Seasons
          </h1>
          <p className="page-subtitle">
            History of leagues, champions, and team rosters.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-box-value">{stats.total}</span>
          <p className="stat-box-label">Total Seasons</p>
        </div>
        <div className="stat-box">
          <span className="stat-box-value text-radiant">{stats.active}</span>
          <p className="stat-box-label">Active</p>
        </div>
        <div className="stat-box">
          <span className="stat-box-value">{stats.completed}</span>
          <p className="stat-box-label">Completed</p>
        </div>
        <div className="stat-box">
          <span className="stat-box-value text-accent">{stats.totalTeams}</span>
          <p className="stat-box-label">Total Teams</p>
        </div>
      </div>

      {/* Seasons List */}
      <div className="seasons-list">
        {seasons.length === 0 ? (
          <div className="empty-state-large">No seasons found.</div>
        ) : (
          seasons.map((season) => (
            <div key={season.id} className="season-card-large">
              {/* Season Header */}
              <div className="season-header">
                <div className="season-header-content">
                  <div>
                    <div className="season-title-row">
                      <h2 className="season-name">{season.name}</h2>
                      <span className={`status-badge ${getStatusClass(season.status)}`}>
                        {season.status}
                      </span>
                    </div>
                    <p className="season-dates">
                      <Calendar size={14} />
                      {formatDate(season.startDate)} - {formatDate(season.endDate)}
                    </p>
                  </div>
                  {season.prizePool && (
                    <div className="prize-pool-box">
                      <p className="prize-pool-label">Prize Pool</p>
                      <p className="prize-pool-value">{season.prizePool}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Teams Grid */}
              <div className="season-teams-section">
                <h3 className="teams-section-title">
                  <Users size={16} /> Participating Teams
                </h3>
                <div className="teams-grid">
                  {season.teams && season.teams.length > 0 ? (
                    season.teams.map((team, idx) => (
                      <div key={idx} className="team-card-small">
                        <div className="team-card-header">
                          <span className="team-name-small">{team.teamName}</span>
                          {season.status === "COMPLETED" && idx === 0 && (
                            <Award className="champion-icon" size={18} />
                          )}
                        </div>
                        {team.captainName && (
                          <div className="team-captain">
                            Captain: <span>{team.captainName}</span>
                          </div>
                        )}
                        {(team.wins !== undefined || team.losses !== undefined) && (
                          <>
                            <div className="team-winrate-bar">
                              <div
                                className="team-winrate-fill"
                                style={{
                                  width: `${((team.wins || 0) / ((team.wins || 0) + (team.losses || 0) || 1)) * 100}%`,
                                }}
                              />
                            </div>
                            <div className="team-record">
                              <span className="wins">{team.wins || 0} W</span>
                              <span className="losses">{team.losses || 0} L</span>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="no-teams-message">No teams registered yet.</div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Seasons;
