import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Container, Form, Alert, Card } from "react-bootstrap";
import { useAuthStore } from "../store/AuthStore";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const success = await login(username, password);

    if (success) {
      navigate("/");
    } else {
      setError("Invalid username or password");
    }

    setIsSubmitting(false);
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center slide-in"
      style={{ minHeight: "80vh" }}
    >
      <Card style={{ width: "100%", maxWidth: "400px" }} className="auth-card">
        <Card.Body>
          <h2 className="text-center">Admin Login</h2>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </Form.Group>

            <button
              type="submit"
              className="btn-accent w-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
