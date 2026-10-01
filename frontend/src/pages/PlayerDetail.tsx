import {Link, useParams} from "react-router";
import {usePlayer, usePlayers} from "../services/Queries.ts";
import Page from "../components/Page.tsx";
import Panel from "../components/Panel.tsx";
import StatStrip from "../components/StatStrip.tsx";
import EloLadder from "../components/EloLadder.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";
import {formatDate, formatElo, formatEloChange, formatRelative} from "../util/format.ts";

const RECENT_MATCH_COUNT = 10;

export default function PlayerDetail() {
    const {steamId} = useParams<{ steamId: string }>();
    const {data: player, isLoading, isError} = usePlayer(steamId);
    const {data: players} = usePlayers();

    // A grey bar stands in for the title, at the same height so the banner doesn't jump when data arrives
    if (isLoading) return (
        <Page title={<>
            <span aria-hidden="true" className="inline-block h-[0.8em] w-72 max-w-full rounded-md bg-white/10 motion-safe:animate-pulse"/>
            <span className="sr-only">Player</span>
        </>}>
            <Loader label="Loading player"/>
        </Page>
    );
    if (isError || !player) return <Page title="Player not found"><QueryError message="Couldn't find this player."/></Page>;

    // Both lists come from the API already ordered: players by ELO, matches newest first
    const rank = players ? players.findIndex(p => p.steamId === player.steamId) + 1 : 0;
    const matches = player.recentMatches;
    // Largest ELO swing in the list, so the history bars share one scale
    const maxChange = Math.max(0, ...matches.map(m => Math.abs(m.eloChange ?? 0)));

    return (
        <Page
            title={player.username}
            subtitle={rank > 0 && players ? `Rank ${rank} of ${players.length}` : undefined}
            aside={
                <div className="sm:text-right">
                    <p className="text-sm text-ash">ELO</p>
                    <p className="figures text-5xl font-semibold leading-none">{formatElo(player.elo)}</p>
                </div>
            }
        >
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="min-w-0 space-y-4">
                    {players && (
                        <Panel title="On the ladder" meta={`${players.length} players`}>
                            <EloLadder players={players} highlightSteamId={player.steamId} highlightLabel={player.username}/>
                        </Panel>
                    )}
                    <Panel title="Match history" meta={matches.length ? `Last ${matches.length} matches` : undefined} flush>
                        {matches.length ? (
                            <div className="divide-y divide-rule/70">
                                {/*Laid out like a Stratz match row: result, side, ELO swing, match type, then when*/}
                                {matches.map((match) => {
                                    const change = match.eloChange;
                                    const swing = change !== null && maxChange > 0 ? (Math.abs(change) / maxChange) * 50 : 0;
                                    const gained = change === null || change >= 0;
                                    return (
                                        <Link key={match.matchId} to={`/matches/${match.matchId}`}
                                              className="grid grid-cols-[1.5rem_3.5rem_minmax(0,1fr)_auto] items-center gap-x-4 px-3 py-2.5 transition-colors hover:bg-panel-raised focus-visible:-outline-offset-2
                                                      sm:grid-cols-[1.5rem_7rem_3.5rem_6rem_minmax(0,1fr)_7.5rem]">
                                            <span title={match.won ? "Won" : "Lost"}
                                                  className={`inline-flex size-6 items-center justify-center rounded-[3px] text-xs font-bold text-night ${
                                                      match.won ? "bg-win" : "bg-loss"}`}>
                                                <span aria-hidden="true">{match.won ? "W" : "L"}</span>
                                                <span className="sr-only">{match.won ? "Won" : "Lost"}</span>
                                            </span>

                                            {/*Too narrow for the side on phones; it's one tap away on the match page*/}
                                            <p className="sr-only flex items-center gap-2 text-sm text-ash sm:not-sr-only">
                                                {match.side === "RADIANT" ? "Radiant" : "Dire"}
                                                {match.sub && <span className="rounded-sm bg-panel-raised px-1 text-xs">Sub</span>}
                                            </p>

                                            {change === null ? (
                                                <p className="text-right text-ash sm:border-l sm:border-rule sm:pl-4" title="No ELO record for this match">
                                                    <span aria-hidden="true">&ndash;</span><span className="sr-only">No ELO record</span>
                                                </p>
                                            ) : (
                                                <p className={`figures text-right sm:border-l sm:border-rule sm:pl-4 ${gained ? "" : "text-ash"}`}>
                                                    <span className="sr-only">ELO </span>{formatEloChange(change)}
                                                </p>
                                            )}
                                            <span aria-hidden="true" className="relative hidden h-1.5 rounded-full bg-rule sm:block">
                                                <span className={`absolute inset-y-0 ${gained ? "left-1/2 rounded-r-full bg-accent" : "right-1/2 rounded-l-full bg-ash"}`}
                                                      style={{width: `${swing}%`}}/>
                                                <span className="absolute -top-0.5 left-1/2 h-2.5 w-0.5 -translate-x-1/2 bg-bone/70"/>
                                            </span>

                                            <p className="truncate text-ash sm:border-l sm:border-rule sm:pl-4">
                                                {match.seasonName ?? "In-house"}
                                            </p>

                                            <p className="text-right sm:border-l sm:border-rule sm:pl-4">
                                                <span className="figures block text-sm">{formatDate(match.timePlayed)}</span>
                                                <span className="block text-xs text-ash">{formatRelative(match.timePlayed)}</span>
                                            </p>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="p-4 text-ash">No matches recorded yet. Results show up here once an admin enters them.</p>
                        )}
                    </Panel>
                </div>

                <aside className="space-y-4">
                    <Panel title="Record">
                        <StatStrip stats={[
                            {label: "Wins", value: player.wins},
                            {label: "Losses", value: player.losses},
                            {label: "Win rate", value: `${player.winRate}%`},
                        ]}/>
                        {player.wins + player.losses > 0 && (
                            <div aria-hidden="true" className="mt-4 flex h-1.5 gap-0.5">
                                <div className="rounded-l-full bg-win" style={{flexGrow: player.wins}}/>
                                <div className="rounded-r-full bg-loss" style={{flexGrow: player.losses}}/>
                            </div>
                        )}
                    </Panel>
                    {matches.length > 0 && (
                        <Panel title={`Last ${Math.min(matches.length, RECENT_MATCH_COUNT)} matches`} meta="Newest first">
                            <ol className="grid grid-cols-10 gap-1">
                                {matches.slice(0, RECENT_MATCH_COUNT).map(match => {
                                    const label = `${match.won ? "Won" : "Lost"} on ${formatDate(match.timePlayed)}`;
                                    return (
                                        <li key={match.matchId}>
                                            <Link to={`/matches/${match.matchId}`}
                                                  aria-label={label} title={label}
                                               className={`flex aspect-square w-full items-center justify-center rounded-[3px] text-xs font-bold text-night ${
                                                   match.won ? "bg-win" : "bg-loss"}`}>
                                                <span aria-hidden="true">{match.won ? "W" : "L"}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ol>
                        </Panel>
                    )}
                </aside>
            </div>
        </Page>
    );
}
