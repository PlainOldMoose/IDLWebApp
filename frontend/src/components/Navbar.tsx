import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/AuthStore";

function NavbarComponent() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <Navbar
      sticky="top"
      data-bs-theme="dark"
      expand="lg"
      className="navbar-gradient"
    >
      <Container>
        <Container className="text-dark p-4 rounded">
          <Navbar.Brand as={Link} to="/">
            IDLuk
          </Navbar.Brand>
        </Container>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/matches">
              Matches
            </Nav.Link>
            <Nav.Link as={Link} to="/leaderboard">
              Leaderboard
            </Nav.Link>
            <Nav.Link as={Link} to="/seasons">
              Seasons
            </Nav.Link>

            {/* Admin-only link */}
            {isAuthenticated && user?.isAdmin && (
              <Nav.Link as={Link} to="/admin">
                Admin
              </Nav.Link>
            )}
          </Nav>
          <Nav>
            {isAuthenticated ? (
              <Nav.Link onClick={handleLogout} style={{ cursor: "pointer" }}>
                Logout
              </Nav.Link>
            ) : (
              <Nav.Link as={Link} to="/login">
                Login
              </Nav.Link>
            )}
            <NavDropdown title="Tools" id="basic-nav-dropdown">
              <NavDropdown.Item as={Link} to="/tools/inhouse">
                In-house Balancer
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/tools/drafter">
                Season Drafter
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/tools/doodle">
                Doodle
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarComponent;
