import { useNavigate } from "react-router";
import { usePlayers } from "../services/Queries";
import PlayerList from "../components/PlayerList/PlayerList";

import {
  eloColumn,
  usernameColumn,
} from "../components/PlayerList/ColumnHelpers";

export default function Leaderboard() {
  const navigate = useNavigate();
  const { data: players, isPending, isError } = usePlayers();

  const sortedPlayers = players?.slice().sort((a, b) => b.elo - a.elo) ?? [];

  return (
    <div className="container mt-4 slide-in">
      <h2 className="title-gradient">Leaderboard</h2>
      <PlayerList
        players={sortedPlayers}
        columns={[usernameColumn(), eloColumn()]}
        showRank
        isLoading={isPending}
        errorMessage={isError ? "Error loading players" : undefined}
        onPlayerClick={(player) => navigate(`/players/${player.steamId}`)}
      />
    </div>
  );
}
