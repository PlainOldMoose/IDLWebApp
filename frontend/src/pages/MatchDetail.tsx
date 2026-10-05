import {type FormEvent, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router";
import {useCurrentUser, useDeleteMatch, useMatchDetail} from "../services/Queries.ts";
import Page from "../components/Page.tsx";
import Panel from "../components/Panel.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";
import {formatDate, formatElo, formatEloChange} from "../util/format.ts";

const sides = ["RADIANT", "DIRE"] as const;
const rowColumns = "grid grid-cols-[minmax(0,1fr)_4.5rem_3.5rem] gap-x-3";

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

    const handleDelete = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        deleteMatch.mutate(undefined, {onSuccess: () => navigate(`/seasons/${data?.match.seasonId}`)});
    };

    if (isLoading) return <Page title="Match"><Loader label="Loading match"/></Page>;
    if (isError || !data) return <Page title="Match not found"><QueryError message="Couldn't find this match."/></Page>;

    const {match, players} = data;
    const radiantWon = match.winner === "RADIANT";

    return (
        <Page
            title={
                <span className="inline-flex items-baseline gap-4">
                    {/*Sits on the baseline and stands one capital tall, so it spans the letters rather than the font's line box*/}
                    <span aria-hidden="true" className={`h-[1cap] w-1 shrink-0 ${radiantWon ? "bg-radiant" : "bg-dire"}`}/>
                    {/*Season games name the winning team; in-houses have no teams, only sides*/}
                    {(radiantWon ? match.radiantTeamName : match.direTeamName) ?? (radiantWon ? "Radiant" : "Dire")} victory
                </span>
            }
            subtitle={
                <span className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="figures">{formatDate(match.timePlayed)}</span>
                    <span>{match.seasonName ?? "In-house"}</span>
                    <span className="figures">{match.avgElo.toLocaleString("en-GB")} avg ELO</span>
                    <span className="figures">Match {match.matchId}</span>
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
            <div className="grid items-start gap-4 lg:grid-cols-2">
                {sides.map(side => {
                    const radiant = side === "RADIANT";
                    const won = match.winner === side;
                    const team = players.filter(p => p.side === side);
                    const elos = team.flatMap(p => p.eloBefore ?? []);
                    const avgElo = elos.length ? elos.reduce((sum, elo) => sum + elo, 0) / elos.length : null;
                    const teamName = radiant ? match.radiantTeamName : match.direTeamName;
                    return (
                        <Panel key={side}
                               title={
                                   <span className="flex items-baseline gap-2">
                                       {teamName ?? (radiant ? "Radiant" : "Dire")}
                                       {teamName && <span className="text-sm font-normal text-ash">{radiant ? "Radiant" : "Dire"}</span>}
                                   </span>
                               }
                               meta={
                                   <span className="flex gap-3">
                                       {avgElo !== null && <span className="figures">{formatElo(avgElo)} avg</span>}
                                       <span className={won ? "font-medium text-bone" : ""}>{won ? "Won" : "Lost"}</span>
                                   </span>
                               }
                               className={won ? (radiant ? "ring-1 ring-radiant/70" : "ring-1 ring-dire/70") : ""}
                               padded={false}>
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
                                                <Link to={`/players/${player.steamId}`} className={`row-link ${rowColumns} items-center px-3 py-2`}>
                                                    <span className="flex min-w-0 items-center gap-2">
                                                        <span className="truncate">{player.username}</span>
                                                        {player.sub && (
                                                            <span className="shrink-0 rounded-sm bg-panel-raised px-1 text-xs text-ash">
                                                                Sub{player.subbingFor && <span className="sr-only"> for {player.subbingFor}</span>}
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
                                                            <span className={`figures text-right ${player.eloChange < 0 ? "text-ash" : ""}`}>
                                                                {formatEloChange(player.eloChange)}
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
                            <button className="primary-button" disabled={confirmText !== "delete" || deleteMatch.isPending}>Delete match</button>
                        </div>
                    </form>
                </dialog>
            )}
        </Page>
    );
}
