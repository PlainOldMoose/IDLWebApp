import { useEffect, useState, useMemo } from "react";
import { Swords, Calendar, ExternalLink } from "lucide-react";

interface Match {
  matchId: number;
  winner: string;
  timePlayed: string;
  avgElo: number;
}

type FilterType = "all" | "radiant" | "dire";

function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");

  useEffect(() => {
    fetch("http://localhost:8080/api/matches")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setMatches(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filteredMatches = useMemo(() => {
    if (filterType === "all") return matches;
    return matches.filter(
      (m) => m.winner.toLowerCase() === filterType
    );
  }, [matches, filterType]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
            <Swords className="text-accent" size={32} />
            Matches
          </h1>
          <p className="page-subtitle">Browse recent league games and results.</p>
        </div>

        {/* Filter Buttons */}
        <div className="filter-group">
          <button
            onClick={() => setFilterType("all")}
            className={`filter-btn ${filterType === "all" ? "active" : ""}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType("radiant")}
            className={`filter-btn ${filterType === "radiant" ? "active" : ""}`}
          >
            Radiant
          </button>
          <button
            onClick={() => setFilterType("dire")}
            className={`filter-btn ${filterType === "dire" ? "active" : ""}`}
          >
            Dire
          </button>
        </div>
      </div>

      {/* Match Cards */}
      <div className="matches-grid">
        {filteredMatches.map((match) => (
          <div key={match.matchId} className="match-card">
            {/* Match Header */}
            <div className="match-card-header">
              <div className="match-card-meta">
                <span className="match-card-id">#{match.matchId}</span>
                <span className="match-card-date">
                  <Calendar size={12} /> {formatDate(match.timePlayed)}
                </span>
              </div>
              <div className="match-card-links">
                <span className="match-card-elo">Avg: {match.avgElo}</span>
                <a
                  href={`https://stratz.com/matches/${match.matchId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="match-external-link"
                >
                  STRATZ <ExternalLink size={10} />
                </a>
              </div>
            </div>

            {/* Match Content */}
            <div className="match-card-content">
              {/* Radiant Side */}
              <div
                className={`match-team radiant ${match.winner === "RADIANT" ? "winner" : "loser"}`}
              >
                <div className="team-header radiant">
                  <h4>RADIANT</h4>
                </div>
                <div className="team-placeholder">Team data</div>
              </div>

              {/* VS Indicator */}
              <div className="match-vs">
                <div className="vs-text">VS</div>
                <div
                  className={`winner-badge ${match.winner === "RADIANT" ? "radiant" : "dire"}`}
                >
                  {match.winner === "RADIANT" ? "Radiant Victory" : "Dire Victory"}
                </div>
              </div>

              {/* Dire Side */}
              <div
                className={`match-team dire ${match.winner === "DIRE" ? "winner" : "loser"}`}
              >
                <div className="team-header dire">
                  <h4>DIRE</h4>
                </div>
                <div className="team-placeholder">Team data</div>
              </div>
            </div>
          </div>
        ))}

        {filteredMatches.length === 0 && (
          <div className="empty-state-large">No matches found.</div>
        )}
      </div>
    </div>
  );
}

export default Matches;
