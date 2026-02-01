import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Container, Form, Alert, Card, Row, Col } from "react-bootstrap";
import { useAuthStore } from "../../store/AuthStore";
import { useCreateSeason } from "../../services/Queries";

export default function CreateSeason() {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const createSeasonMutation = useCreateSeason();

  if (!isAuthenticated || !user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return "Season name is required";
    }
    if (!startDate) {
      return "Start date is required";
    }
    if (!endDate) {
      return "End date is required";
    }
    if (new Date(endDate) <= new Date(startDate)) {
      return "End date must be after start date";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await createSeasonMutation.mutateAsync({
        name: name.trim(),
        startDate,
        endDate,
      });
      navigate("/seasons");
    } catch (err) {
      setError("Failed to create season. Please try again.");
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center slide-in"
      style={{ minHeight: "80vh" }}
    >
      <Card style={{ width: "100%", maxWidth: "500px" }} className="auth-card">
        <Card.Body>
          <h2 className="text-center mb-4">Create Season</h2>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Season Name</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Season 5"
                required
                autoFocus
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <button
              type="submit"
              className="btn-accent w-100"
              disabled={createSeasonMutation.isPending}
            >
              {createSeasonMutation.isPending ? "Creating..." : "Create Season"}
            </button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
