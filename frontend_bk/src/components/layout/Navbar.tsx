import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";

function Navbar() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  const [menuOpen, setMenuOpen] = useState(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-bs-theme",
      darkMode ? "dark" : "light",
    );
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // REMOVED: the useEffect with location

  const navLinks = [
    { to: "/players", label: "Players" },
    { to: "/matches", label: "Matches" },
    { to: "/seasons", label: "Seasons" },
    { to: "/tools", label: "Tools" },
  ];

  return (
    <nav className="navbar navbar-expand-md sticky-top navbar-glass">
      <div className="container">
        {/* Logo */}
        <NavLink
          to="/"
          className="navbar-brand d-flex align-items-center gap-2"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="rounded d-flex align-items-center justify-content-center"
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>🎮</span>
          </div>
          <span className="fw-bold">
            IDL<span style={{ color: "#6366f1" }}>uk</span>
          </span>
        </NavLink>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Nav Links */}
        <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}>
          <ul className="navbar-nav me-auto mb-2 mb-md-0 ms-md-4">
            {navLinks.map((link) => (
              <li className="nav-item" key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `nav-link text-uppercase fw-bold small ${
                      isActive ? "active" : ""
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Right side - Theme Toggle */}
          <div className="d-flex align-items-center">
            <button
              className="btn btn-link nav-link px-2"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
