import { useEffect, useState, useMemo } from "react";
import { Users, Shuffle, Crown, Swords, Check, RefreshCw, Hand } from "lucide-react";

interface Player {
  steamId: string;
  username: string;
  elo: number;
}

type ToolMode = "balancer" | "draft";
type DraftPhase = "setup" | "picking" | "complete";

function Tools() {
  const [mode, setMode] = useState<ToolMode>("balancer");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            League Tools
          </h1>
          <p className="page-subtitle">
            Utilities for organizing in-house matches.
          </p>
        </div>
      </div>

      {/* Tool Selector Tabs */}
      <div className="tool-tabs">
        <button
          onClick={() => setMode("balancer")}
          className={`tool-tab ${mode === "balancer" ? "active" : ""}`}
        >
          In-house Balancer
        </button>
        <button
          onClick={() => setMode("draft")}
          className={`tool-tab ${mode === "draft" ? "active" : ""}`}
        >
          Captains Draft
        </button>
      </div>

      {/* Tool Content */}
      <div className="tool-content">
        {mode === "balancer" ? (
          <BalancerTool players={players} />
        ) : (
          <DraftTool players={players} />
        )}
      </div>
    </div>
  );
}

// --- In-house Balancer Component ---

function BalancerTool({ players }: { players: Player[] }) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [teams, setTeams] = useState<{ radiant: Player[]; dire: Player[] } | null>(null);

  const togglePlayer = (id: string) => {
    if (selectedPlayers.includes(id)) {
      setSelectedPlayers((prev) => prev.filter((p) => p !== id));
    } else {
      if (selectedPlayers.length < 10) {
        setSelectedPlayers((prev) => [...prev, id]);
      }
    }
    setTeams(null);
  };

  const handleBalance = () => {
    const selected = players.filter((p) => selectedPlayers.includes(p.steamId));
    const sorted = [...selected].sort((a, b) => b.elo - a.elo);

    const teamA: Player[] = [];
    const teamB: Player[] = [];

    sorted.forEach((player, index) => {
      // Snake logic: A, B, B, A, A, B, B, A...
      const pattern = index % 4;
      if (pattern === 0 || pattern === 3) {
        teamA.push(player);
      } else {
        teamB.push(player);
      }
    });

    setTeams({ radiant: teamA, dire: teamB });
  };

  const calculateAvg = (team: Player[]) => {
    if (team.length === 0) return 0;
    return Math.round(team.reduce((acc, p) => acc + p.elo, 0) / team.length);
  };

  return (
    <div className="balancer-grid">
      {/* Player Selection Column */}
      <div className="balancer-selection">
        <div className="tool-card">
          <div className="tool-card-header">
            <h3 className="tool-card-title">
              <Users size={18} /> Player Pool
            </h3>
            <span className={`selection-count ${selectedPlayers.length === 10 ? "full" : ""}`}>
              {selectedPlayers.length} / 10 Selected
            </span>
          </div>

          <div className="player-pool-list">
            {players.map((p) => (
              <div
                key={p.steamId}
                onClick={() => togglePlayer(p.steamId)}
                className={`player-pool-item ${selectedPlayers.includes(p.steamId) ? "selected" : ""}`}
              >
                <div className="player-pool-checkbox">
                  <div className={`checkbox ${selectedPlayers.includes(p.steamId) ? "checked" : ""}`}>
                    {selectedPlayers.includes(p.steamId) && <Check size={10} />}
                  </div>
                  <span className={`player-pool-name ${selectedPlayers.includes(p.steamId) ? "selected" : ""}`}>
                    {p.username}
                  </span>
                </div>
                <span className="player-pool-elo">{p.elo}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleBalance}
            disabled={selectedPlayers.length < 2}
            className="balance-btn"
          >
            <Shuffle size={18} /> Balance Teams
          </button>
        </div>
      </div>

      {/* Results Column */}
      <div className="balancer-results">
        {!teams ? (
          <div className="balancer-placeholder">
            <Shuffle size={48} className="placeholder-icon" />
            <p>Select players and click Balance</p>
          </div>
        ) : (
          <div className="teams-result">
            {/* Radiant Team */}
            <div className="team-result-card radiant">
              <div className="team-result-header">
                <h3 className="team-result-name radiant">RADIANT</h3>
                <div className="team-result-elo">
                  <div className="elo-value">{calculateAvg(teams.radiant)}</div>
                  <div className="elo-label">Avg Elo</div>
                </div>
              </div>
              <div className="team-result-players">
                {teams.radiant.map((p) => (
                  <div key={p.steamId} className="team-result-player">
                    <span className="player-name">{p.username}</span>
                    <span className="player-elo radiant">{p.elo}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dire Team */}
            <div className="team-result-card dire">
              <div className="team-result-header">
                <h3 className="team-result-name dire">DIRE</h3>
                <div className="team-result-elo">
                  <div className="elo-value">{calculateAvg(teams.dire)}</div>
                  <div className="elo-label">Avg Elo</div>
                </div>
              </div>
              <div className="team-result-players">
                {teams.dire.map((p) => (
                  <div key={p.steamId} className="team-result-player">
                    <span className="player-name">{p.username}</span>
                    <span className="player-elo dire">{p.elo}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="teams-difference">
              Difference: <span className="diff-value">{Math.abs(calculateAvg(teams.radiant) - calculateAvg(teams.dire))}</span> Elo
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Captains Draft Component ---

function DraftTool({ players }: { players: Player[] }) {
  const [phase, setPhase] = useState<DraftPhase>("setup");
  const [draftState, setDraftState] = useState<{
    pool: Player[];
    radiant: Player[];
    dire: Player[];
    turn: "radiant" | "dire";
  } | null>(null);

  const handleStartDraft = () => {
    const sorted = [...players].sort((a, b) => b.elo - a.elo);
    const radCap = sorted[0];
    const direCap = sorted[1];
    const pool = sorted.slice(2, 10); // Top 8 remaining

    setDraftState({
      pool,
      radiant: [radCap],
      dire: [direCap],
      turn: "radiant",
    });
    setPhase("picking");
  };

  const getTeamElo = (team: Player[]) => team.reduce((sum, p) => sum + p.elo, 0);

  const handlePick = (player: Player) => {
    if (!draftState) return;

    const isRadiantTurn = draftState.turn === "radiant";
    const newRadiant = isRadiantTurn ? [...draftState.radiant, player] : draftState.radiant;
    const newDire = !isRadiantTurn ? [...draftState.dire, player] : draftState.dire;

    const radiantFull = newRadiant.length >= 5;
    const direFull = newDire.length >= 5;

    let nextTurn: "radiant" | "dire";

    if (radiantFull && !direFull) {
      nextTurn = "dire";
    } else if (direFull && !radiantFull) {
      nextTurn = "radiant";
    } else if (radiantFull && direFull) {
      nextTurn = "radiant";
    } else {
      const radElo = getTeamElo(newRadiant);
      const direElo = getTeamElo(newDire);

      if (radElo < direElo) {
        nextTurn = "radiant";
      } else if (direElo < radElo) {
        nextTurn = "dire";
      } else {
        nextTurn = isRadiantTurn ? "dire" : "radiant";
      }
    }

    const newPool = draftState.pool.filter((p) => p.steamId !== player.steamId);

    setDraftState({
      pool: newPool,
      radiant: newRadiant,
      dire: newDire,
      turn: nextTurn,
    });

    if (newPool.length === 0) {
      setPhase("complete");
    }
  };

  const resetDraft = () => {
    setPhase("setup");
    setDraftState(null);
  };

  if (phase === "setup") {
    return (
      <div className="draft-setup">
        <Crown size={48} className="draft-setup-icon" />
        <h2 className="draft-setup-title">Setup Draft Lobby</h2>
        <p className="draft-setup-text">
          The top 2 highest Elo players will be assigned as Captains automatically.
          The next 8 players will form the draft pool.
        </p>
        <button onClick={handleStartDraft} className="draft-start-btn">
          Start Captains Draft
        </button>
      </div>
    );
  }

  if (!draftState) return null;
  const isDraftComplete = phase === "complete";

  return (
    <div className="draft-active">
      {/* Status Bar */}
      <div className="draft-status-bar">
        {isDraftComplete ? (
          <div className="draft-complete-status">
            <Check size={24} /> Draft Complete
          </div>
        ) : (
          <div className="draft-picking-status">
            <span className="picking-label">Current Pick</span>
            <span className={`picking-team ${draftState.turn}`}>
              {draftState.turn === "radiant" ? "RADIANT" : "DIRE"}
            </span>
            <span className="picking-hint">(Lowest Total Elo picks)</span>
          </div>
        )}
      </div>

      <div className="draft-grid">
        {/* Radiant Roster */}
        <div className={`draft-team-card radiant ${draftState.turn === "radiant" && !isDraftComplete ? "active" : ""}`}>
          <div className="draft-team-header">
            <h3 className="draft-team-name radiant">RADIANT</h3>
            <span className="draft-team-total">Total: {getTeamElo(draftState.radiant)}</span>
          </div>
          <div className="draft-team-roster">
            {draftState.radiant.map((p, i) => (
              <div key={p.steamId} className="draft-team-player">
                <div className="draft-player-info">
                  <div className={`draft-player-badge radiant ${i === 0 ? "captain" : ""}`}>
                    {i === 0 ? "C" : i + 1}
                  </div>
                  <span className="draft-player-name">{p.username}</span>
                </div>
                <span className="draft-player-elo">{p.elo}</span>
              </div>
            ))}
            {Array.from({ length: 5 - draftState.radiant.length }).map((_, i) => (
              <div key={`empty-${i}`} className="draft-empty-slot">
                Empty Slot
              </div>
            ))}
          </div>
        </div>

        {/* Pool */}
        <div className="draft-pool">
          <h3 className="draft-pool-title">Available Pool</h3>
          <div className="draft-pool-list">
            {draftState.pool.map((p) => (
              <button
                key={p.steamId}
                onClick={() => handlePick(p)}
                disabled={isDraftComplete}
                className="draft-pool-player"
              >
                <span className="draft-pool-player-name">{p.username}</span>
                <div className="draft-pool-player-meta">
                  <span className="draft-pool-player-elo">{p.elo}</span>
                  {!isDraftComplete && (
                    <Hand size={16} className={`pick-hand ${draftState.turn}`} />
                  )}
                </div>
              </button>
            ))}
            {isDraftComplete && (
              <div className="draft-reset-container">
                <button onClick={resetDraft} className="draft-reset-btn">
                  <RefreshCw size={16} /> Reset Draft
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dire Roster */}
        <div className={`draft-team-card dire ${draftState.turn === "dire" && !isDraftComplete ? "active" : ""}`}>
          <div className="draft-team-header dire-header">
            <span className="draft-team-total">Total: {getTeamElo(draftState.dire)}</span>
            <h3 className="draft-team-name dire">DIRE</h3>
          </div>
          <div className="draft-team-roster">
            {draftState.dire.map((p, i) => (
              <div key={p.steamId} className="draft-team-player dire">
                <span className="draft-player-elo">{p.elo}</span>
                <div className="draft-player-info">
                  <span className="draft-player-name">{p.username}</span>
                  <div className={`draft-player-badge dire ${i === 0 ? "captain" : ""}`}>
                    {i === 0 ? "C" : i + 1}
                  </div>
                </div>
              </div>
            ))}
            {Array.from({ length: 5 - draftState.dire.length }).map((_, i) => (
              <div key={`empty-${i}`} className="draft-empty-slot">
                Empty Slot
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tools;
