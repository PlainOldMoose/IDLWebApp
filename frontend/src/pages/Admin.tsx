import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/AuthStore";

interface AdminStats {
  totalPlayers: number;
  totalMatches: number;
  totalSeasons: number;
  totalTeams: number;
}

export default function Admin() {
  const { isAuthenticated, user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.isAdmin) {
      fetch("http://localhost:8080/api/admin/stats", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then(setStats)
        .catch(console.error);
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container className="mt-4 slide-in">
      <h1 className="title-gradient mb-2">Admin Dashboard</h1>
      <p className="text-muted mb-4">Welcome back, {user.username}</p>

      <Row className="g-4 mb-4">
        <Col sm={6} lg={3}>
          <div className="admin-stat-card">
            <h3>{stats?.totalPlayers ?? "-"}</h3>
            <p>Players</p>
          </div>
        </Col>
        <Col sm={6} lg={3}>
          <div className="admin-stat-card">
            <h3>{stats?.totalMatches ?? "-"}</h3>
            <p>Matches</p>
          </div>
        </Col>
        <Col sm={6} lg={3}>
          <div className="admin-stat-card">
            <h3>{stats?.totalSeasons ?? "-"}</h3>
            <p>Seasons</p>
          </div>
        </Col>
        <Col sm={6} lg={3}>
          <div className="admin-stat-card">
            <h3>{stats?.totalTeams ?? "-"}</h3>
            <p>Teams</p>
          </div>
        </Col>
      </Row>

      <div className="admin-info-card">
        <h5>Quick Actions</h5>
        <p>
          Use the edit buttons on the Matches, Seasons, and Player pages to
          manage data.
        </p>
      </div>
    </Container>
  );
}
