import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import NavbarComponent from "./components/Navbar";
import Landing from "./pages/Landing";
import Leaderboard from "./pages/Leaderboard";
import PlayerProfile from "./pages/PlayerProfile";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Matches from "./pages/match/Matches";
import Seasons from "./pages/season/Seasons";
import { useAuthStore } from "./store/AuthStore";
import MatchDetail from "./pages/match/MatchDetail";
import SeasonDetail from "./pages/season/SeasonDetail";
import CreateSeason from "./pages/season/CreateSeason";
import InhouseBalancer from "./pages/tools/InhouseBalancer";
import SeasonDrafter from "./pages/tools/SeasonDrafter";
import Doodle from "./pages/tools/Doodle";

const queryClient = new QueryClient();

function AppContent() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <NavbarComponent />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/players/:steamId" element={<PlayerProfile />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:matchId" element={<MatchDetail />} />
        <Route path="/seasons" element={<Seasons />} />
        <Route path="/seasons/create" element={<CreateSeason />} />
        <Route path="/seasons/:seasonId" element={<SeasonDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/tools/inhouse" element={<InhouseBalancer />} />
        <Route path="/tools/drafter" element={<SeasonDrafter />} />
        <Route path="/tools/doodle" element={<Doodle />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
