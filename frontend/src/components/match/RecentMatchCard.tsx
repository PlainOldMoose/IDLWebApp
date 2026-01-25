import { Card, Row, Col, Badge } from "react-bootstrap";
import { formatDistanceToNow } from "date-fns";
import type { PlayerMatch } from "../../types/player/PlayerDetail";

interface RecentMatchCardProps {
  match: PlayerMatch;
  onClick?: () => void;
}

export default function RecentMatchCard({
  match,
  onClick,
}: RecentMatchCardProps) {
  const won = match.won;
  const eloPrefix = match.eloChange >= 0 ? "+" : "";

  return (
    <Card
      className="match-card mb-3"
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      <Card.Body className="py-3 px-4">
        <Row className="align-items-center">
          <Col xs="auto" md={2}>
            <span className="text-muted small">#{match.matchId}</span>
          </Col>
          <Col xs={3} md={3} className="text-muted">
            {formatDistanceToNow(new Date(match.timePlayed), {
              addSuffix: true,
            })}
          </Col>
          <Col xs={3} md={3}>
            <Badge bg={won ? "success" : "danger"} className="px-3 py-2">
              {won ? "WIN" : "LOSS"}
            </Badge>
          </Col>
          <Col xs={3} md={4} className="text-end">
            <span
              style={{
                color:
                  match.eloChange >= 0
                    ? "var(--bs-success)"
                    : "var(--bs-danger)",
                fontWeight: 600,
              }}
            >
              {eloPrefix}
              {match.eloChange} ELO
            </span>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
