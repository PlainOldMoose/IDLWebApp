import { BrowserRouter, Route, Routes } from "react-router";
import "./App.css";
import NavbarComponent from "./components/Navbar";
import Leaderboard from "./pages/Leaderboard";
import PlayerProfile from "./pages/PlayerProfile";

function App() {
  return (
    <BrowserRouter>
      <NavbarComponent />
      <Routes>
        <Route path="/" element={<Leaderboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/players/:steamId" element={<PlayerProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
