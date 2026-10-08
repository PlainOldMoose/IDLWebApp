import {type SubmitEvent, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router";
import {useCurrentUser, useDeleteMatch, useMatchDetail} from "../services/Queries.ts";
import Page from "../components/Page.tsx";
import Panel from "../components/Panel.tsx";
import StatStrip from "../components/StatStrip.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";
import {formatDate, formatElo, formatEloChange, formatOrdinal, sideName} from "../util/format.ts";

const sides = ["RADIANT", "DIRE"] as const;
const rowColumns = "grid grid-cols-[minmax(0,1fr)_4.5rem_3.5rem] gap-x-3";
const winnerRing = {RADIANT: "ring-1 ring-radiant/70", DIRE: "ring-1 ring-dire/70"};
const changeColour = (change: number) => change > 0 ? "text-win" : change < 0 ? "text-loss" : "";

// Our own match page, laid out like Stratz's: who played on each side and the ELO they took in. In-houses have no Stratz page
export default function MatchDetail() {
    const {matchId} = useParams<{ matchId: string }>();
    const {data, isLoading, isError} = useMatchDetail(matchId);
    const {data: user} = useCurrentUser();
    const deleteMatch = useDeleteMatch(matchId);
    const deleteDialogRef = useRef<HTMLDialogElement>(null);
    const [confirmText, setConfirmText] = useState("");
    const navigate = useNavigate();

    const openDeleteDialog = () => {
        deleteMatch.reset();
        setConfirmText("");
        deleteDialogRef.current?.showModal();
    };

    const handleDelete = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        deleteMatch.mutate(undefined, {onSuccess: () => navigate(`/seasons/${data?.match.seasonId}`)});
    };

    if (isLoading) return <Page title="Match"><Loader label="Loading match"/></Page>;
    if (isError || !data) return <Page title="Match not found"><QueryError message="Couldn't find this match."/></Page>;

    const {match, players} = data;
    const radiantWon = match.winner === "RADIANT";
    const teams = sides.map(side => {
        const team = players.filter(p => p.side === side);
        const elos = team.flatMap(p => p.eloBefore ?? []);
        const name = (side === "RADIANT" ? match.radiantTeamName : match.direTeamName) ?? sideName[side];
        const standing = side === "RADIANT" ? data.radiantStanding : data.direStanding;
        return {side, team, name, standing, avgElo: elos.length ? elos.reduce((sum, elo) => sum + elo, 0) / elos.length : null};
    });
    const [radiantTeam, direTeam] = teams;
    const eloDiff = radiantTeam.avgElo !== null && direTeam.avgElo !== null ? radiantTeam.avgElo - direTeam.avgElo : null;
    // Radiant's expected result, from the same formula EloService uses; Dire's is the rest, so the two always add to 100
    const radiantChance = eloDiff === null ? null : Math.round(100 / (1 + 10 ** (-eloDiff / 400)));

    return (
        <Page
            title={
                <span className="inline-flex items-baseline gap-4">
                    {/*Sits on the baseline and stands one capital tall, so it spans the letters rather than the font's line box*/}
                    <span aria-hidden="true" className={`h-[1cap] w-1 shrink-0 ${radiantWon ? "bg-radiant" : "bg-dire"}`}/>
                    {/*Season games name the winning team; in-houses have no teams, only sides*/}
                    {(radiantWon ? radiantTeam : direTeam).name} victory
                </span>
            }
            subtitle={
                <span className="flex flex-wrap gap-x-4 gap-y-1">
                    <span>{formatDate(match.timePlayed)}</span>
                    <span>{match.seasonName ?? "In-house"}</span>
                    <span>{match.avgElo.toLocaleString("en-GB")} avg ELO</span>
                    <span>Match {match.matchId}</span>
                </span>
            }
            aside={match.seasonName && (
                <div className="flex flex-wrap gap-3">
                    {/*The API refuses a finished season's matches*/}
                    {user?.admin && (
                        <button className="secondary-button text-danger" onClick={openDeleteDialog}>Delete match</button>
                    )}
                    <a href={`https://stratz.com/matches/${match.matchId}`} target="_blank" rel="noopener noreferrer" className="primary-button">
                        Open on Stratz
                    </a>
                </div>
            )}
        >
            {/*Radiant left and Dire right, the same as the team panels below*/}
            {eloDiff !== null && radiantChance !== null && (
                <Panel title="Pre-game odds" className="mb-4">
                    <StatStrip stats={[
                        {label: radiantTeam.name, value: `${radiantChance}%`},
                        {label: "Avg ELO gap", value: formatElo(Math.abs(eloDiff))},
                        {label: direTeam.name, value: `${100 - radiantChance}%`},
                    ]}/>
                </Panel>
            )}
            <div className="grid items-start gap-4 lg:grid-cols-2">
                {teams.map(({side, team, name, standing, avgElo}) => {
                    const won = match.winner === side;
                    const played = standing ? standing.wins + standing.losses : 0;
                    return (
                        <Panel key={side}
                               title={
                                   <span className="flex items-baseline gap-2">
                                       {name}
                                       {name !== sideName[side] && <span className="text-sm font-normal text-ash">{sideName[side]}</span>}
                                   </span>
                               }
                               meta={
                                   <span className="flex items-center gap-3">
                                       {avgElo !== null && <span className="text-bone tabular-nums">{formatElo(avgElo)} avg</span>}
                                       {/*Filled for the winner, hollow for the loser, so the result doesn't rest on the side colour*/}
                                       <span className={`rounded-md border px-2 py-0.5 font-semibold ${won ? "border-bone bg-bone text-night" : "border-rule text-ash"}`}>
                                           {won ? "Won" : "Lost"}
                                       </span>
                                   </span>
                               }
                               className={won ? winnerRing[side] : ""}
                               padded={false}>
                            {/*Where the team stood in the season just before this game; a first game has no standing or rate yet*/}
                            {standing && (
                                <div className="border-b border-rule pt-2 pb-3">
                                    <StatStrip stats={[
                                        {label: "Standing", value: played ? `${formatOrdinal(standing.position)} of ${standing.teamCount}` : "–"},
                                        {label: "Record", value: `${standing.wins}W ${standing.losses}L`},
                                        {label: "Win rate", value: played ? `${Math.round(100 * standing.wins / played)}%` : "–"},
                                    ]}/>
                                </div>
                            )}
                            {team.length ? (
                                <>
                                    <div aria-hidden="true" className={`${rowColumns} px-3 pt-1.5 pb-2 text-sm text-ash`}>
                                        <p>Player</p>
                                        <p className="text-right">ELO</p>
                                        <p className="text-right">±</p>
                                    </div>
                                    <ul>
                                        {team.map(player => (
                                            <li key={player.steamId}>
                                                <Link to={`/players/${player.steamId}`} className={`row-link ${rowColumns} items-center px-3 py-2.5 text-lg`}>
                                                    <span className="min-w-0">
                                                        <span className="block truncate">{player.username}</span>
                                                        {player.sub && (
                                                            <span className="block truncate text-sm text-ash">
                                                                {player.subbingFor ? `Sub for ${player.subbingFor}` : "Sub"}
                                                            </span>
                                                        )}
                                                    </span>
                                                    {player.eloBefore === null || player.eloChange === null ? (
                                                        <span className="col-span-2 text-right text-ash" title="No ELO record for this match">
                                                            <span aria-hidden="true">&ndash;</span><span className="sr-only">No ELO record</span>
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className="figures text-right"><span className="sr-only">ELO </span>{formatElo(player.eloBefore)}</span>
                                                            {/*The sign carries gain or loss; the colour only backs it up*/}
                                                            <span className={`figures text-right ${changeColour(player.eloChange)}`}>
                                                                <span className="sr-only">Change </span>{formatEloChange(player.eloChange)}
                                                            </span>
                                                        </>
                                                    )}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <p className="p-3 text-ash">No players recorded.</p>
                            )}
                        </Panel>
                    );
                })}
            </div>

            {user?.admin && (
                <dialog ref={deleteDialogRef} aria-labelledby="delete-match-title"
                        className="dialog">
                    <h2 id="delete-match-title" className="font-display text-3xl font-bold">Delete match</h2>
                    <form onSubmit={handleDelete} className="mt-4 space-y-4">
                        <p>
                            This permanently deletes match <strong className="figures">{match.matchId}</strong> and takes it
                            off the standings. Everyone's ELO is worked out again from this game on.
                        </p>
                        <label className="block">
                            Type <strong>delete</strong> to confirm
                            <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off"
                                   className="text-input mt-2 block w-full"/>
                        </label>
                        {deleteMatch.isError && <p role="alert" className="text-sm text-ash">{deleteMatch.error.message}</p>}
                        <div className="flex justify-end gap-3">
                            <button type="button" className="secondary-button" onClick={() => deleteDialogRef.current?.close()}>Cancel</button>
                            <button type="submit" className="primary-button" disabled={confirmText !== "delete" || deleteMatch.isPending}>Delete match</button>
                        </div>
                    </form>
                </dialog>
            )}
        </Page>
    );
}
