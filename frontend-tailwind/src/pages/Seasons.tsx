import {useSeasons} from "../services/Queries.ts";
import SeasonSummaryCard from "../components/SeasonSummaryCard.tsx";

export default function Seasons() {
    const {data: seasons, isLoading, isError} = useSeasons();

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error...</div>;

    return (
        <div>
            {seasons?.map((season) => (
                <SeasonSummaryCard key={season.id} season={season}/>
                ))}
        </div>
    );
}