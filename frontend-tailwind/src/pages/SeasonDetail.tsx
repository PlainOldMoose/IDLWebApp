import {useParams} from "react-router-dom";
import {useSeasonDetail, useSeasonSignups} from "../services/Queries.ts";


export default function SeasonDetail() {
    const {seasonId} = useParams<{ seasonId: string }>();
    const {data: season, isPending, isError} = useSeasonDetail(seasonId);
    const {data: signups, isPending: signupsPending, isError: signupsError} = useSeasonSignups(seasonId);

    if (isPending) return <p>Loading...</p>;
    if (isError) return <p>Season not found</p>;

    const startDate = new Date(season.startDate).toLocaleDateString("en-GB");
    const endDate = new Date(season.endDate).toLocaleDateString("en-GB")

    return (
        <div className="reveal-in">
            {/*Season Header*/}
            <div className="flex justify-between items-center my-12">
                <h1 className="text-4xl font-bold">{season.name}</h1>
                {season.status === "REGISTRATION" && (
                    <button
                        className="px-4 py-2 bg-surface-a20 text-white font-extrabold rounded-lg"
                        onClick={handleSignup}
                    >Signup
                    </button>
                )}
            </div>

            {/* Season info*/}
            <div className="flex justify-between bg-surface-a20 rounded-2xl p-8 mt-4">
                <p>{startDate} - {endDate}</p>
                <p>Status: {season.status}</p>
            </div>

            {/*Signups*/}
            {season.status === "REGISTRATION" && (
                <>
                    <h1 className="text-2xl font-bold my-6">Signups</h1>
                    <div className="bg-surface-a20 rounded-2xl p-8 mt-4">
                        <p className="bg-surface-a10 max-w-32 rounded-xl text-xs text-center mx-auto mb-2 p-1">Willing to Captain</p>
                        <div className="grid grid-cols-4">
                            {signups?.map((signup) => (
                                <div key={signup.steamId}>
                                    <p className={`font-extrabold m-2 p-2 text-center rounded-xl
                                 ${signup.willingToCaptain ? "bg-surface-a10" : "bg-surface-a30"}`}>
                                        {signup.username}</p>
                                </div>
                            ))}
                        </div>

                    </div>
                </>
            )}
        </div>
    );
}