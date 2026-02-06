import {usePlayers} from "../services/Queries.ts";

export default function Players() {
    const {data: players, isLoading, isError} = usePlayers();

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error...</div>;

    return (
        <div>
            <h1>Players</h1>
            <ul>
                {players?.map((player) => (
                    <li key={player.steamId}>
                        {player.username} - ELO: {player.elo}
                    </li>
                ))}
            </ul>
        </div>
    );
}