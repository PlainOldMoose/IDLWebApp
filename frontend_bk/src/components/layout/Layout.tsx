import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <div className="container" py-4>
          <Outlet />
        </div>
      </main>
      <footer className="border-top py-4 mt-auto">
        <div className="container text-center text-muted small">
          &copy; {new Date().getFullYear()} IDL | In-house Dota 2 League
        </div>
      </footer>
    </div>
  );
}

export default Layout;
