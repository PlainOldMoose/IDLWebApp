import {useParams} from "react-router-dom";
import {
    useCurrentUser,
    useSeasonDetail,
    useSeasonMatches,
    useSeasons,
    useSeasonSignup,
    useSeasonSignups
} from "../services/Queries.ts";
import MatchSummaryCard from "../components/MatchSummaryCard.tsx";


export default function SeasonDetail() {
    const {seasonId} = useParams<{ seasonId: string }>();
    const {data: season, isPending, isError} = useSeasonDetail(seasonId);
    const {data: signups, isPending: signupsPending, isError: signupsError} = useSeasonSignups(seasonId);
    const {data: user} = useCurrentUser();
    const {data: matches} = useSeasonMatches(seasonId, season?.status !== "REGISTRATION");
    const signup = useSeasonSignup(seasonId);
    const alreadySignedUp = signups?.some(s => s.steamId === user?.steamId);

    const handleSignup = () => {
        if (user) {
            signup.mutate(false);
        } else {
            globalThis.location.href = `http://localhost:8080/auth/login?returnTo=${encodeURIComponent(globalThis.location.pathname)}`;
        }
    };

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
                        className="px-4 py-2 bg-surface-a20 text-white font-extrabold rounded-lg hover:cursor-pointer disabled:opacity-50"
                        onClick={handleSignup}
                        disabled={alreadySignedUp}
                    >{user ? (alreadySignedUp ? "Signed Up" : "Sign Up") : ("Login to Sign Up")}
                    </button>
                )}
            </div>

            {/* Season info*/}
            <div className="flex justify-between bg-surface-a20 rounded-2xl p-8 mt-4">
                <p>{startDate} - {endDate}</p>
                {season.winnerTeamName && <p>Winner: {season.winnerTeamName}</p>}
                <p>Status: {season.status}</p>
            </div>

            {/*Signups*/}
            {season.status === "REGISTRATION" && (
                <>
                    <h1 className="text-2xl font-bold my-6">Signups</h1>
                    <div className="bg-surface-a20 rounded-2xl p-8 mt-4">
                        <p className="bg-surface-a10 max-w-32 rounded-xl text-xs text-center mx-auto mb-2 p-1">Willing
                            to Captain</p>
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

            {/*Teams*/}
            {(season.status === "ACTIVE" || season.status === "COMPLETED") && (
                <>
                    <h1 className="text-2xl font-bold my-6">Teams</h1>
                    <div className="grid grid-cols-3 gap-4">
                        {season.teams.map((team) => (
                            <div key={team.teamId}
                                 className="flex flex-col justify-between bg-surface-a20 rounded-2xl p-8 mt-4">
                                <p className="font-extrabold text-xl mb-2">{team.teamName}</p>
                                <div>
                                    {team.members.map(member => (
                                        <p key={member.steamId}
                                           className={member.username === team.captainUsername ? "font-bold" : "text-light-a20/90"}>{member.username}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/*Matches*/}
            {(season.status === "ACTIVE" || season.status === "COMPLETED") && (
                <>
                    <h1 className="text-2xl font-bold my-6">Matches</h1>
                    {matches?.map((match) => (
                        <MatchSummaryCard key={match.matchId} match={match}/>
                    ))}
                </>
            )}
        </div>
    );
}