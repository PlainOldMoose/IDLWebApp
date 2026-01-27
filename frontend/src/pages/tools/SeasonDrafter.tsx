import { Card } from "react-bootstrap";

export default function SeasonDrafter() {
  return (
    <div className="container mt-4 slide-in">
      <h2 className="title-gradient mb-4">Season Drafter</h2>
      <Card className="stat-card">
        <Card.Body className="text-center p-5">
          <h4 style={{ color: "rgba(255, 255, 255, 0.7)" }}>Under Construction</h4>
          <p className="text-muted">This tool is currently being developed.</p>
        </Card.Body>
      </Card>
    </div>
  );
}
