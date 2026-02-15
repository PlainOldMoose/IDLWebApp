import {usePlayer} from "../services/Queries.ts";
import {useParams} from "react-router-dom";
import PlayerMatchCard from "../components/PlayerMatchCard.tsx";
import PlayerStatsCard from "../components/PlayerStatsCard.tsx";


export default function PlayerDetail() {
    const {steamId} = useParams<{ steamId: string }>();
    const {data: player, isLoading} = usePlayer(steamId);

    if (isLoading || !player) {
        return null;
    }

    return (
        <div>
            <h1 className="font-bold text-5xl my-12 text-center">{player.username}</h1>
            <div>
                <PlayerStatsCard player={player}/>
            </div>
            <div>
                <h1 className="font-extrabold text-3xl text-center my-8">History</h1>
                {player.recentMatches?.map((match) => (
                    <PlayerMatchCard key={match.matchId} match={match}/>
                ))}
            </div>
        </div>
    );
}