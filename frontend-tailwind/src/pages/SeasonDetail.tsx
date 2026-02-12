import {useParams} from "react-router-dom";
import {useSeasonDetail} from "../services/Queries.ts";


export default function SeasonDetail() {
    const {seasonId} = useParams<{ seasonId: string }>();
    const {data: season, isPending, isError} = useSeasonDetail(seasonId);

    if (isPending) return <p>Loading...</p>;
    if (isError) return <p>Season not found</p>;

    return (
        <div>
            {/*Season Header*/}
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold my-12">{season.name}</h1>
                {season.status === "REGISTRATION" && (
                    <button
                        className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg"
                    >Signup
                    </button>
                )}
            </div>

            {/* Season info*/}
            <div className="flex bg-surface-a20 rounded-2xl p-8 mt-4">
                <p>Start Date: {new Date(season.startDate).toLocaleDateString("en-GB")}</p>
                <p>End Date: {new Date(season.endDate).toLocaleDateString("en-GB")}</p>
                <p>Status: {season.status}</p>
            </div>
        </div>
    );
}