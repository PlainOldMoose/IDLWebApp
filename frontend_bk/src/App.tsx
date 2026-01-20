import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Players from "./pages/Players";
import Layout from "./components/layout/Layout";
import PlayerProfile from "./pages/PlayerProfile";
import Matches from "./pages/Matches";
import Seasons from "./pages/Seasons";
import Tools from "./pages/Tools";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/players" replace />} />
          <Route path="players" element={<Players />} />
          <Route path="players/:steamId" element={<PlayerProfile />} />
          <Route path="matches" element={<Matches />} />
          <Route path="seasons" element={<Seasons />} />
          <Route path="tools" element={<Tools />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
