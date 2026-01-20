import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { Users, Swords, Trophy, Wrench } from "lucide-react";

function Sidebar() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true; // Default to dark
  });

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-bs-theme",
      darkMode ? "dark" : "light",
    );
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <nav
      className="sidebar text-white p-3 d-flex flex-column"
      style={{ width: "240px", minHeight: "100vh" }}
    >
      <div className="d-flex align-items-center gap-2 mb-4 px-2">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center"
          style={{
            width: 40,
            height: 40,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          }}
        >
          <span style={{ fontSize: "1.25rem" }}>🎮</span>
        </div>
        <div>
          <h5 className="mb-0 fw-bold">IDL</h5>
          <small className="opacity-50" style={{ fontSize: "0.7rem" }}>
            Inhouse League
          </small>
        </div>
      </div>

      <small
        className="text-uppercase opacity-50 px-2 mb-2"
        style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
      >
        Menu
      </small>

      <ul className="nav flex-column flex-grow-1 gap-1">
        <li className="nav-item">
          <NavLink
            to="/players"
            className={({ isActive }) =>
              `nav-link text-white d-flex align-items-center gap-2 ${isActive ? "active" : ""}`
            }
          >
            <Users size={18} /> Players
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/matches"
            className={({ isActive }) =>
              `nav-link text-white d-flex align-items-center gap-2 ${isActive ? "active" : ""}`
            }
          >
            <Swords size={18} /> Matches
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/seasons"
            className={({ isActive }) =>
              `nav-link text-white d-flex align-items-center gap-2 ${isActive ? "active" : ""}`
            }
          >
            <Trophy size={18} /> Seasons
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/tools"
            className={({ isActive }) =>
              `nav-link text-white d-flex align-items-center gap-2 ${isActive ? "active" : ""}`
            }
          >
            <Wrench size={18} /> Tools
          </NavLink>
        </li>
      </ul>

      <div className="border-top border-secondary pt-3 mt-3">
        <button
          className="btn btn-outline-light btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;
