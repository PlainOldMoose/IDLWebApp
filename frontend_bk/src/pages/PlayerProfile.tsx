import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  User,
  Activity,
  TrendingUp,
  TrendingDown,
  Swords,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

interface RecentMatch {
  matchId: number;
  playedAt: string;
  won: boolean;
  eloChange: number;
  seasonName: string | null;
}

interface PlayerDetail {
  steamId: string;
  username: string;
  elo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  recentMatches: RecentMatch[];
  eloHistory: number[];
}

function PlayerProfile() {
  const { steamId } = useParams<{ steamId: string }>();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:8080/api/players/${steamId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPlayer(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [steamId]);

  const chartData = useMemo(() => {
    if (!player) return [];
    return player.eloHistory.map((elo, index) => ({
      match: index + 1,
      elo,
      date: new Date(Date.now() - (player.eloHistory.length - index) * 86400000).toISOString(),
    }));
  }, [player]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="page-content">
        <div className="empty-state-large">
          <h2>Player Not Found</h2>
          <p>The player with ID "{steamId}" does not exist.</p>
          <Link to="/players" className="back-link">
            <ArrowLeft size={18} /> Back to Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  // Calculate rank from elo (simplified)
  const rank = 1;

  return (
    <div className="page-content animate-fade-in">
      {/* Navigation */}
      <div className="mb-4">
        <Link to="/players" className="back-link">
          <ArrowLeft size={16} /> Back to Leaderboard
        </Link>
      </div>

      {/* Profile Header */}
      <div className="profile-header-card">
        <div className="profile-header-bg" />

        <div className="profile-header-content">
          <div className="profile-avatar-large">
            {player.username.charAt(0).toUpperCase()}
            <div className="profile-rank-badge">#{rank}</div>
          </div>

          <div className="profile-info">
            <h1 className="profile-username">{player.username}</h1>
            <div className="profile-meta">
              <span className="meta-tag">
                <User size={14} /> Steam ID: {player.steamId}
              </span>
            </div>
          </div>

          {/* Win Rate Circle */}
          <div className="winrate-circle-container">
            <svg className="winrate-svg" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="winrate-bg"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - player.winRate / 100)}
                className={player.winRate >= 50 ? "winrate-fill-good" : "winrate-fill-bad"}
              />
            </svg>
            <span className="winrate-percent">{player.winRate.toFixed(0)}%</span>
            <span className="winrate-label-small">Win Rate</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card accent">
          <div className="profile-stat-icon">
            <Activity size={20} />
          </div>
          <div className="profile-stat-content">
            <span className="profile-stat-label">Current Elo</span>
            <span className="profile-stat-value">{player.elo}</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon">
            <Swords size={20} />
          </div>
          <div className="profile-stat-content">
            <span className="profile-stat-label">Matches Played</span>
            <span className="profile-stat-value">{player.matchesPlayed}</span>
          </div>
        </div>

        <div className="profile-stat-card success">
          <div className="profile-stat-icon">
            <TrendingUp size={20} />
          </div>
          <div className="profile-stat-content">
            <span className="profile-stat-label">Total Wins</span>
            <span className="profile-stat-value">{player.wins}</span>
          </div>
        </div>

        <div className="profile-stat-card danger">
          <div className="profile-stat-icon">
            <TrendingDown size={20} />
          </div>
          <div className="profile-stat-content">
            <span className="profile-stat-label">Total Losses</span>
            <span className="profile-stat-value">{player.losses}</span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="profile-content-grid">
        {/* Elo History Chart */}
        <div className="chart-card">
          <h3 className="card-title">
            <Activity className="text-accent" size={20} />
            Elo History
          </h3>
          <div className="chart-container">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorElo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="match"
                    stroke="#94a3b8"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    domain={["dataMin - 50", "dataMax + 50"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1d2e",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#6366f1" }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="elo"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorElo)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No elo history available.</div>
            )}
          </div>
        </div>

        {/* Recent Matches List */}
        <div className="matches-card">
          <h3 className="card-title">Recent Matches</h3>
          <div className="matches-list">
            {player.recentMatches.map((match) => (
              <div key={match.matchId} className="match-item">
                <div className="match-indicator-wrapper">
                  <div
                    className={`match-indicator ${match.won ? "win" : "loss"}`}
                  />
                  <div className="match-info">
                    <div className="match-result">
                      <span className={match.won ? "text-radiant" : "text-dire"}>
                        {match.won ? "VICTORY" : "DEFEAT"}
                      </span>
                      <span className="match-id">#{match.matchId}</span>
                    </div>
                    <div className="match-meta">
                      <span>
                        {new Date(match.playedAt).toLocaleDateString()}
                      </span>
                      {match.seasonName && (
                        <span className="season-tag">{match.seasonName}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="match-elo">
                  <div
                    className={`elo-change ${match.eloChange > 0 ? "positive" : "negative"}`}
                  >
                    {match.eloChange > 0 ? "+" : ""}
                    {match.eloChange}
                  </div>
                  <a
                    href={`https://www.dotabuff.com/matches/${match.matchId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="dotabuff-link"
                  >
                    Dotabuff <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ))}
            {player.recentMatches.length === 0 && (
              <div className="empty-state">No matches played yet.</div>
            )}
          </div>
          <div className="matches-footer">
            <Link to="/matches" className="view-all-link">
              View All History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerProfile;
