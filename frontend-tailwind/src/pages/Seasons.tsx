import {useSeasons} from "../services/Queries.ts";
import SeasonSummaryCard from "../components/SeasonSummaryCard.tsx";
import SeasonStatCard from "../components/SeasonStatCard.tsx";
import {useNavigate} from "react-router-dom";

export default function Seasons() {
    const {data: seasons, isLoading, isError} = useSeasons();
    const navigate = useNavigate();

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error...</div>;

    return (
        <div>
            <div className="text-5xl text-center font-bold my-12">Seasons</div>
            <div className="grid grid-cols-3 gap-2 mt-4">
                <SeasonStatCard/>
                <SeasonStatCard/>
                <SeasonStatCard/>
            </div>

            {/*Seasons*/}
            <div className="grid grid-cols-3 gap-4 mt-12">
                {seasons?.map((season) => (
                    <SeasonSummaryCard key={season.id} season={season}
                                       onClick={() => navigate(`/seasons/${season.id}`)}/>
                ))}
            </div>
        </div>
    );
}