import { Card, Row, Col, Badge } from "react-bootstrap";
import type { Season } from "../types/season/Season";

interface SeasonCardProps {
  season: Season;
  onClick?: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status: Season["status"]) {
  switch (status) {
    case "ACTIVE":
      return <Badge bg="success">Active</Badge>;
    case "REGISTRATION":
      return <Badge bg="danger">REGISTRATION</Badge>;
    case "COMPLETED":
      return <Badge bg="secondary">Completed</Badge>;
  }
}

export default function SeasonCard({ season, onClick }: SeasonCardProps) {
  return (
    <Card
      className="match-card mb-3"
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      <Card.Body className="py-3 px-4">
        <Row className="align-items-center g-2">
          <Col xs="auto">
            <span className="fw-bold">{season.name}</span>
          </Col>
          <Col xs="auto" className="ms-2">
            {getStatusBadge(season.status)}
          </Col>
          <Col className="text-muted text-end">
            {formatDate(season.startDate)} — {formatDate(season.endDate)}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
