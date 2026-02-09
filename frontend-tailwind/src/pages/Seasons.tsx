import {useSeasons} from "../services/Queries.ts";
import SeasonSummaryCard from "../components/SeasonSummaryCard.tsx";
import SeasonStatCard from "../components/SeasonStatCard.tsx";

export default function Seasons() {
    const {data: seasons, isLoading, isError} = useSeasons();

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error...</div>;

    return (
        <div>
            <div className="grid grid-cols-3 gap-2 mt-4">
                <SeasonStatCard/>
                <SeasonStatCard/>
                <SeasonStatCard/>
            </div>

            {/*Seasons*/}
            <div>
            {seasons?.map((season) => (
                <SeasonSummaryCard key={season.id} season={season}/>
                ))}
            </div>
        </div>
    );
}