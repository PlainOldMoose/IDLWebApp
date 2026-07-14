import { usePlayers } from "../services/Queries.ts";
import { useNavigate } from "react-router-dom";

export default function Players() {
  const { data: players, isLoading, isError } = usePlayers();
  const navigate = useNavigate();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error...</div>;

  return (
    <div>
      <div className="grid grid-cols-6 mt-12">
        <div className="col-start-1 text-5xl text-center font-bold">Players</div>
        <button className="ml-6 col-start-6 basic-button">Add player</button>
      </div>
      <div className="bg-surface-a20 rounded-2xl p-8 mt-4 ">
        <table className="table-auto w-full">
          <thead className="border-b border-surface-a30">
            <tr>
              <th className="text-left py-2 px-4">Rank</th>
              <th className="text-left py-2 px-4">Username</th>
              <th className="text-right py-2 px-4">ELO</th>
            </tr>
          </thead>
          <tbody>
            {players?.map((player, index) => (
              <tr
                key={player.steamId}
                className="border-b border-surface-a30 hover:bg-surface-a30 hover:scale-102"
                onClick={() => navigate(`/players/${player.steamId}`)}
              >
                <td className="text-left py-2 px-4">{index + 1}</td>
                <td className="text-left py-2 px-4">{player.username}</td>
                <td className="text-left py-2 px-4 text-right">{player.elo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
