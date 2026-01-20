import { useParams } from "react-router-dom";
import { Card, Col, Row } from "react-bootstrap";
import { usePlayerDetail } from "../services/Queries";

export default function PlayerProfile() {
  const { steamId } = useParams<{ steamId: string }>();
  const { data: player, isPending, isError } = usePlayerDetail(steamId);

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>Player not found</p>;

  const stats = [
    { label: "Elo", value: player?.elo },
    { label: "Matches Played", value: player?.matchesPlayed },
    { label: "Wins", value: player?.wins },
    { label: "Losses", value: player?.losses },
    { label: "Winrate", value: `${player?.winRate}%` },
  ];

  return (
    <div className="container mt-4 slide-in">
      <h2 className="title-gradient mb-4">{player?.username}</h2>
      <p className="text-muted mb-4"> Steam ID: {player?.steamId}</p>

      <Row xs={2} md={3} lg={5} className="g-4">
        {stats.map((stat) => (
          <Col key={stat.label}>
            <Card className="text-center lift-on-hover stat-card gradient-card-subtle">
              <Card.Body className="p-4">
                <Card.Title className="fs-2">{stat.value}</Card.Title>
                <Card.Text className="text-muted">{stat.label}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
