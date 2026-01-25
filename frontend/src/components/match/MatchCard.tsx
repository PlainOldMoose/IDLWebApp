import { Card, Row, Col, Badge } from "react-bootstrap";
import { formatDistanceToNow } from "date-fns";
import type { Match } from "../../types/match/MatchSummary";

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
}

export default function MatchCard({ match, onClick }: MatchCardProps) {
  const isRadiant = match.winner === "RADIANT";

  return (
    <Card
      className="match-card mb-3"
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      <Card.Body className="py-3 px-4">
        <Row className="align-items-center">
          <Col xs="auto" md={1}>
            <span className="text-muted small text-nowrap">
              #{match.matchId}
            </span>
          </Col>
          <Col xs={3} md={2}>
            <Badge
              bg={isRadiant ? "success" : "danger"}
              className="px-3 py-2 ms-4"
            >
              {match.winner}
            </Badge>
          </Col>
          <Col xs={3} md={3} className="text-muted">
            {formatDistanceToNow(new Date(match.timePlayed), {
              addSuffix: true,
            })}
          </Col>
          <Col xs={2} md={3} className="text-muted">
            {match.avgElo} Average
          </Col>
          <Col xs={2} md={3} className="text-end">
            {match.seasonName ? (
              <Badge bg="secondary">{match.seasonName}</Badge>
            ) : (
              <span className="text-muted small">In-House</span>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
