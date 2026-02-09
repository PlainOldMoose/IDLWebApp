import {useMatches} from "../services/Queries.ts";
import MatchSummaryCard from "../components/MatchSummaryCard.tsx";

export default function Matches() {
    const {data: matches, isLoading, isError} = useMatches();

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error...</div>;

    return(
        <div>
            {matches?.map((match) => (
                <MatchSummaryCard key={match.matchId} match={match}/>
            ))}
        </div>
    );
}