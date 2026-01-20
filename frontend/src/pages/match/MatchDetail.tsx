import { Link, useParams } from "react-router-dom";
import { useMatchDetail } from "../../services/Queries";
import { format, formatDistanceToNow } from "date-fns";
import { Row, Col, Badge } from "react-bootstrap";
import type { MatchParticipant } from "../../types/match/MatchParticipant";

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: match, isPending, isError } = useMatchDetail(Number(matchId));

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>Match not found</p>;

  const radiantPlayers = match.participants.filter((p) => p.side === "RADIANT");
  const direPlayers = match.participants.filter((p) => p.side === "DIRE");

  const radiantWon = match.winner === "RADIANT";
  const direWon = match.winner === "DIRE";

  return (
    <div className="container mt-4 slide-in">
      {/* Header */}
      <div className="match-detail-header">
        <Row className="align-items-center">
          <Col xs={12} md={4}>
            <h1 className="title-gradient">Match #{match.matchId}</h1>
          </Col>
          <Col xs={12} md={4} className="text-md-center">
            <div className="text-muted">
              {formatDistanceToNow(new Date(match.timePlayed), {
                addSuffix: true,
              })}
            </div>
            <div className="small text-secondary">
              {format(new Date(match.timePlayed), "PPpp")}
            </div>
          </Col>
          <Col xs={12} md={4} className="text-md-end mt-3 mt-md-0">
            <span className="me-3 text-muted">{match.avgElo} Avg ELO</span>
            {match.seasonName ? (
              <Badge bg="secondary">{match.seasonName}</Badge>
            ) : (
              <Badge bg="dark">In-House</Badge>
            )}
          </Col>
        </Row>
      </div>

      {/* Teams */}
      <Row>
        <Col md={6} className="mb-4">
          <div
            className={`team-panel team-panel--radiant ${radiantWon ? "team-panel--winner" : ""}`}
          >
            <div className="team-header d-flex justify-content-between align-items-center">
              <h4 style={{ color: "#22c55e" }}>
                {match.radiantTeamName || "Radiant"}
              </h4>
              {radiantWon && <Badge bg="success">Winner</Badge>}
            </div>
            {radiantPlayers.map((player) => (
              <ParticipantRow key={player.steamId} player={player} />
            ))}
          </div>
        </Col>
        <Col md={6} className="mb-4">
          <div
            className={`team-panel team-panel--dire ${direWon ? "team-panel--winner" : ""}`}
          >
            <div className="team-header d-flex justify-content-between align-items-center">
              <h4 style={{ color: "#ef4444" }}>
                {match.direTeamName || "Dire"}
              </h4>
              {direWon && <Badge bg="success">Winner</Badge>}
            </div>
            {direPlayers.map((player) => (
              <ParticipantRow key={player.steamId} player={player} />
            ))}
          </div>
        </Col>
      </Row>
    </div>
  );
}

function ParticipantRow({ player }: { player: MatchParticipant }) {
  const eloChangeClass =
    player.eloChange > 0
      ? "elo-positive"
      : player.eloChange < 0
        ? "elo-negative"
        : "";
  const eloChangePrefix = player.eloChange > 0 ? "+" : "";

  return (
    <div className="participant-row">
      <div className="participant-info">
        <Link to={`/players/${player.steamId}`} className="participant-link">
          {player.username}
        </Link>
        {player.isSub && (
          <span className="sub-badge" title={`Subbing for ${player.subbingForUsername}`}>
            SUB
          </span>
        )}
      </div>
      <div className="participant-stats">
        <span className="elo-current">{player.currentElo} ELO</span>
        <span className={eloChangeClass}>
          {eloChangePrefix}
          {player.eloChange}
        </span>
      </div>
    </div>
  );
}
