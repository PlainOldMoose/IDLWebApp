import {useMatches} from "../services/Queries.ts";
import MatchSummaryCard from "../components/MatchSummaryCard.tsx";

export default function Matches() {
    const {data: matches, isLoading, isError} = useMatches();

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error...</div>;

    return (
        <div>
            <div className="text-5xl text-center font-bold my-12">Matches</div>
            <div className="flex justify-between mt-8 px-6">
                <p>Match ID</p>
                <p>Winner</p>
                <p>Time Played</p>
                <p>Avg Elo</p>
                <p>Season</p>
            </div>
            <div>
                {matches?.map((match) => (
                    <MatchSummaryCard key={match.matchId} match={match}/>
                ))}
            </div>
        </div>
    );
}