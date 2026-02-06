import {usePlayers} from "../services/Queries.ts";

export default function Players() {
    const {data: players, isLoading, isError} = usePlayers();

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error...</div>;

    return (
        <div>
            <div className="bg-accent rounded-2xl p-8 mt-8">
                <table className="table-auto w-full">
                    <thead className="border-b">
                    <tr>
                        <th className="text-left py-2 px-4">Steam ID</th>
                        <th className="text-left py-2 px-4">Username</th>
                        <th className="text-left py-2 px-4">ELO</th>
                    </tr>
                    </thead>
                    <tbody>
                    {players?.map((player) => (
                        <tr key={player.steamId} className="border-b">
                            <td className="text-left py-2 px-4">{player.steamId}</td>
                            <td className="text-left py-2 px-4">{player.username}</td>
                            <td className="text-left py-2 px-4">{player.elo}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}