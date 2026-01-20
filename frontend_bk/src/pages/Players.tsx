import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Search, Medal, ChevronUp, ChevronDown } from "lucide-react";

interface Player {
  steamId: string;
  username: string;
  elo: number;
}

type SortField = "rank" | "username" | "elo";
type SortOrder = "asc" | "desc";

function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("elo");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8080/api/players")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPlayers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    if (players.length === 0) {
      return { total: 0, highest: 0, average: 0 };
    }
    const elos = players.map((p) => p.elo);
    return {
      total: players.length,
      highest: Math.max(...elos),
      average: Math.round(elos.reduce((a, b) => a + b, 0) / elos.length),
    };
  }, [players]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "elo" ? "desc" : "asc");
    }
  };

  const filteredAndSortedPlayers = useMemo(() => {
    let result = [...players];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.username.toLowerCase().includes(lower) ||
          p.steamId.includes(lower)
      );
    }

    result.sort((a, b) => {
      if (sortField === "username") {
        return sortOrder === "asc"
          ? a.username.localeCompare(b.username)
          : b.username.localeCompare(a.username);
      }
      return sortOrder === "asc" ? a.elo - b.elo : b.elo - a.elo;
    });

    return result;
  }, [players, searchTerm, sortField, sortOrder]);

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return <Medal className="text-yellow-400" size={20} />;
    if (rank === 2)
      return <Medal className="text-slate-300" size={20} />;
    if (rank === 3)
      return <Medal className="text-amber-600" size={20} />;
    return <span className="text-slate-500 font-mono">#{rank}</span>;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="sort-icon-placeholder" />;
    return sortOrder === "asc" ? (
      <ChevronUp size={16} />
    ) : (
      <ChevronDown size={16} />
    );
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
            <Trophy className="text-accent" size={32} />
            Leaderboard
          </h1>
          <p className="page-subtitle">
            Season rankings. Top 3 players qualify for Captain status.
          </p>
        </div>

        {/* Search */}
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-box-value">{stats.total}</span>
          <p className="stat-box-label">Active Players</p>
        </div>
        <div className="stat-box">
          <span className="stat-box-value text-accent">{stats.highest}</span>
          <p className="stat-box-label">Highest Elo</p>
        </div>
        <div className="stat-box">
          <span className="stat-box-value">{stats.average}</span>
          <p className="stat-box-label">Avg Elo</p>
        </div>
        <div className="stat-box">
          <span className="stat-box-value text-radiant">
            {filteredAndSortedPlayers.length}
          </span>
          <p className="stat-box-label">Showing</p>
        </div>
      </div>

      {/* Table */}
      <div className="data-table-container">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th
                  className="sortable-th"
                  onClick={() => handleSort("rank")}
                >
                  <div className="th-content">
                    Rank <SortIcon field="rank" />
                  </div>
                </th>
                <th
                  className="sortable-th"
                  onClick={() => handleSort("username")}
                >
                  <div className="th-content">
                    Player <SortIcon field="username" />
                  </div>
                </th>
                <th
                  className="sortable-th text-end"
                  onClick={() => handleSort("elo")}
                >
                  <div className="th-content justify-content-end">
                    Elo Rating <SortIcon field="elo" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedPlayers.map((player, index) => (
                <tr
                  key={player.steamId}
                  className="data-row"
                  onClick={() => navigate(`/players/${player.steamId}`)}
                >
                  <td className="rank-cell">{getRankBadge(index + 1)}</td>
                  <td>
                    <div className="player-cell">
                      <div className="player-avatar">
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="player-name">{player.username}</span>
                    </div>
                  </td>
                  <td className="text-end">
                    <span className="elo-value">{player.elo}</span>
                  </td>
                </tr>
              ))}
              {filteredAndSortedPlayers.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty-state">
                    No players found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Players;
