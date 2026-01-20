import { useState } from "react";
import { usePlayers, usePlayerDetail } from "../services/Queries";

export default function Players() {
  const [selectedSteamId, setSelectedSteamId] = useState<string | undefined>();

  // Fetch all players (summary)
  const { data: players, isPending, isError } = usePlayers();

  // Fetch selected player's details (only runs when selectedSteamId is set)
  const { data: playerDetail, isPending: detailPending } =
    usePlayerDetail(selectedSteamId);

  if (isPending) return <p>Loading players...</p>;
  if (isError) return <p>Error loading players</p>;

  return (
    <div>
      <h2>All Players</h2>
      <ul>
        {players?.map((player) => (
          <li key={player.steamId}>
            <button onClick={() => setSelectedSteamId(player.steamId)}>
              {player.username} - Elo: {player.elo}
            </button>
          </li>
        ))}
      </ul>

      {selectedSteamId && (
        <div>
          <h2>Player Details</h2>
          {detailPending ? (
            <p>Loading details...</p>
          ) : playerDetail ? (
            <div>
              <p>
                <strong>Username:</strong> {playerDetail.username}
              </p>
              <p>
                <strong>Steam ID:</strong> {playerDetail.steamId}
              </p>
              <p>
                <strong>Elo:</strong> {playerDetail.elo}
              </p>
              <p>
                <strong>Matches Played:</strong> {playerDetail.matchesPlayed}
              </p>
              <p>
                <strong>Wins:</strong> {playerDetail.wins}
              </p>
              <p>
                <strong>Losses:</strong> {playerDetail.losses}
              </p>
              <p>
                <strong>Winrate:</strong> {playerDetail.winRate}%
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
