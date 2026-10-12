import {type ReactNode, type SubmitEvent, useEffect, useState} from "react";
import {
    useApproveInhouse,
    useCancelInhouse,
    useCreateInhouse,
    useCurrentUser,
    useInhouseBalance,
    useInhouseResult,
    useInhouses,
    usePendingInhouses,
    usePlayers
} from "../services/Queries.ts";
import type {Inhouse, PlayerSummary} from "../types.ts";
import Page from "../components/Page.tsx";
import Panel from "../components/Panel.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";
import {formatElo, formatEloChange, formatRelative, sideName} from "../util/format.ts";

const average = (team: PlayerSummary[]) => team.reduce((sum, player) => sum + player.elo, 0) / team.length;

// A team's chance to win, the same expectation EloService.eloChange uses. 50% is a perfectly even game
const winChance = (team: PlayerSummary[], opponents: PlayerSummary[]) => 1 / (1 + 10 ** ((average(opponents) - average(team)) / 400));
const percentFormat = new Intl.NumberFormat("en-GB", {style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1});
const sideBorder = {RADIANT: "border-radiant", DIRE: "border-dire"} as const;
const otherSide = (side: "RADIANT" | "DIRE"): "RADIANT" | "DIRE" => side === "RADIANT" ? "DIRE" : "RADIANT";

// The action a card's footer is waiting on, asked in place instead of with the browser's confirm()
type Confirming =
    | { id: number, kind: "approve" | "reject" | "cancel" }
    | { id: number, kind: "report", teamASide: "RADIANT" | "DIRE", winner: "RADIANT" | "DIRE" };

// Takes over a card's footer until the action is confirmed or dropped. Escape goes back
function ConfirmStrip({danger, edge, label, busy, onConfirm, onBack, children}: {
    danger?: boolean, edge?: string, label: string, busy: boolean, onConfirm: () => void, onBack: () => void, children: ReactNode
}) {
    return (
        <div role="group" aria-label={label} onKeyDown={(e) => e.key === "Escape" && onBack()}
             className={`confirm-strip mt-1.5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-l-3 border-t-rule px-3 pt-3 pb-1.5 ${
                 edge ?? (danger ? "border-l-danger" : "border-l-win")}`}>
            <div className="min-w-0">{children}</div>
            <div className="ml-auto flex gap-3">
                <button type="button" className="secondary-button" onClick={onBack}>Back</button>
                {/*Focused on open so Enter confirms and Escape backs out, all from the keyboard*/}
                <button type="button" autoFocus disabled={busy} onClick={onConfirm}
                        className={danger ? "secondary-button border-danger/60 text-danger hover:border-danger hover:text-danger" : "primary-button"}>
                    {label}
                </button>
            </div>
        </div>
    );
}

// Team A and Team B side by side, each with its average ELO. Sides are only known once someone reports the result,
// so only the admin queue shows them, along with each player's ELO change if it's approved
function Teams({inhouse}: { inhouse: Inhouse }) {
    const teams = [
        {name: "Team A" as const, team: inhouse.teamA, side: inhouse.teamASide},
        {name: "Team B" as const, team: inhouse.teamB, side: inhouse.teamASide && otherSide(inhouse.teamASide)},
    ];
    return (
        // The admin queue's extra ELO-change column doesn't fit two teams across a phone, so they stack there
        <div className={`grid gap-x-3 gap-y-3 ${inhouse.eloChanges ? "sm:grid-cols-2" : "grid-cols-2"}`}>
            {teams.map(({name, team, side}) => (
                <div key={name} className="min-w-0">
                    <p className={`flex justify-between gap-2 border-l-3 px-2 py-1 text-sm ${side ? sideBorder[side] : "border-ash"}`}>
                        <span className="flex gap-2 whitespace-nowrap">
                            <span className="font-semibold">{name}</span>
                            {side && <span className="text-ash">{sideName[side]}</span>}
                        </span>
                        <span className="figures text-ash">{formatElo(average(team))}<span className="sr-only"> average ELO</span></span>
                    </p>
                    <ul className="mt-1">
                        {team.map(player => (
                            <li key={player.steamId} className="flex justify-between gap-2 px-2 py-1">
                                <span className="truncate">{player.username}</span>
                                <span className="flex gap-2">
                                    <span className="figures text-ash">{formatElo(player.elo)}</span>
                                    {inhouse.eloChanges && (
                                        <span className={`figures w-12 text-right ${inhouse.eloChanges[player.steamId] > 0 ? "text-win" : "text-loss"}`}>
                                            {formatEloChange(inhouse.eloChanges[player.steamId])}
                                        </span>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

export default function Inhouses() {
    const {data: inhouses, isPending, isError} = useInhouses();
    const {data: user} = useCurrentUser();
    const {data: players} = usePlayers();
    const [chosen, setChosen] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const balance = useInhouseBalance(chosen);
    const createInhouse = useCreateInhouse();
    const reportResult = useInhouseResult();
    const cancelInhouse = useCancelInhouse();
    // Only admins ask for the queue; the API refuses everyone else
    const pending = usePendingInhouses(!!user?.admin);
    const approveInhouse = useApproveInhouse();
    const [confirming, setConfirming] = useState<Confirming | null>(null);
    // The id restarts the timer and the rise-in animation, even for the same message twice in a row
    const [toast, setToast] = useState<{ message: string, id: number } | null>(null);
    const done = (message: string) => ({
        onSuccess: () => {
            setConfirming(null);
            setToast({message, id: Date.now()});
        }
    });

    useEffect(() => {
        if (!toast) return;
        // Matches the toast-life animation in index.css
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    const byId = new Map(players?.map(player => [player.steamId, player] as const));
    const query = search.trim().toLowerCase();
    const matching = query ? (players ?? []).filter(player =>
        player.username.toLowerCase().includes(query) && !chosen.includes(player.steamId)) : [];
    // Enter adds the exact name, or else the first suggestion
    const searchMatch = matching.find(player => player.username.toLowerCase() === query) ?? matching[0];
    const busy = reportResult.isPending || cancelInhouse.isPending || approveInhouse.isPending;
    const actionError = reportResult.error ?? cancelInhouse.error ?? approveInhouse.error;

    const add = (player: PlayerSummary) => {
        setChosen([...chosen, player.steamId]);
        setSearch("");
    };

    const startInhouse = (option: Inhouse) => {
        createInhouse.mutate({
            teamA: option.teamA.map(player => player.steamId),
            teamB: option.teamB.map(player => player.steamId),
        }, {onSuccess: () => setChosen([])});
    };

    // Everyone's result waits in the admin queue, admins' own included. The form says which team won and which played
    // Dire; the API takes both as sides
    const report = (e: SubmitEvent<HTMLFormElement>, id: number) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const teamASide = data.get("dire") === "A" ? "DIRE" : "RADIANT";
        setConfirming({id, kind: "report", teamASide, winner: data.get("won") === "A" ? teamASide : otherSide(teamASide)});
    };

    return (
        <Page title="In-houses" subtitle="Pick 10 players and the most even teams. After the game, report who won and which team played Dire; an admin approves it before ELO changes.">
            {user ? (
                <>
                    {/*Not clipped, so the suggestion list can hang below the panel*/}
                    <Panel title="Balance teams" meta={`${chosen.length}/10 players`} className="overflow-visible!">
                        <form onSubmit={(e) => { e.preventDefault(); if (searchMatch) add(searchMatch); }} className="flex gap-2">
                            <label htmlFor="inhouse-player" className="sr-only">Player to add</label>
                            {/*Our own list rather than a datalist, which iOS only offers in the bar above the keyboard.
                               Shown while the input has focus; pressing a suggestion keeps that focus, so the keyboard
                               stays up for the next player*/}
                            <div className="group relative w-64 min-w-0">
                                <input id="inhouse-player" value={search}
                                       onChange={(e) => setSearch(e.target.value)} disabled={chosen.length === 10}
                                       autoComplete="off" spellCheck={false} placeholder="Add a player…"
                                       className="text-input w-full"/>
                                {matching.length > 0 && (
                                    <ul aria-label="Matching players" onMouseDown={(e) => e.preventDefault()}
                                        className="absolute inset-x-0 top-full z-10 mt-1 hidden overflow-hidden rounded-md border border-rule bg-panel-raised py-1 shadow-lg group-focus-within:block">
                                        {matching.slice(0, 8).map(player => (
                                            <li key={player.steamId}>
                                                <button type="button" onClick={() => add(player)}
                                                        className="flex w-full cursor-pointer justify-between gap-2 px-3 py-2 text-left hover:bg-white/5">
                                                    <span className="truncate">{player.username}</span>
                                                    <span className="figures text-ash">{formatElo(player.elo)}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </form>
                        {chosen.length > 0 && (
                            <ul className="mt-4 grid max-w-2xl gap-x-6 sm:grid-cols-2">
                                {chosen.map(steamId => {
                                    const player = byId.get(steamId);
                                    return (
                                        <li key={steamId} className="flex items-center justify-between gap-2 py-0.5">
                                            <span className="truncate">{player?.username}</span>
                                            <span className="flex items-center gap-2">
                                                <span className="figures text-ash">{player && formatElo(player.elo)}</span>
                                                <button type="button" aria-label={`Remove ${player?.username}`}
                                                        onClick={() => setChosen(chosen.filter(id => id !== steamId))}
                                                        className="cursor-pointer rounded-md p-1 text-ash transition-colors hover:bg-white/5 hover:text-bone">
                                                    {/*Phosphor's X*/}
                                                    <svg aria-hidden="true" width={16} height={16} viewBox="0 0 256 256" fill="currentColor">
                                                        <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
                                                    </svg>
                                                </button>
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Panel>

                    {balance.isError && <div className="mt-4"><QueryError message="Couldn't balance these players."/></div>}
                    {balance.data && (
                        <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
                            {balance.data.map((option, index) => (
                                <Panel key={index} title={`Option ${index + 1}`} level={3} padded={false}
                                       meta={<span className="figures">
                                           Team A {percentFormat.format(winChance(option.teamA, option.teamB))} to win
                                           · {formatElo(Math.abs(average(option.teamA) - average(option.teamB)))} apart
                                       </span>}>
                                    <Teams inhouse={option}/>
                                    <div className="mt-1.5 flex justify-end border-t border-rule px-1.5 pt-3 pb-1.5">
                                        <button className="primary-button" disabled={createInhouse.isPending}
                                                onClick={() => startInhouse(option)}>
                                            Use these teams
                                        </button>
                                    </div>
                                </Panel>
                            ))}
                        </div>
                    )}
                    {createInhouse.isError && <p role="alert" className="mt-2 text-sm text-ash">Couldn't start the in-house. Refresh and try again.</p>}
                </>
            ) : (
                <p className="text-ash">Sign in to balance teams and start an in-house.</p>
            )}

            {user?.admin && (
                <>
                    <h2 className="mt-10 mb-4 px-4 font-display text-3xl font-bold">Waiting for approval</h2>
                    {pending.isPending ? (
                        <Loader label="Loading results waiting for approval"/>
                    ) : pending.isError ? (
                        <QueryError message="Couldn't load results waiting for approval."/>
                    ) : pending.data.length ? (
                        <div className="grid items-start gap-4 lg:grid-cols-2">
                            {pending.data.map(inhouse => {
                                const id = inhouse.id!;
                                const winner = inhouse.reportedWinner!;
                                const teamAWon = winner === inhouse.teamASide;
                                const winnerTeam = teamAWon ? "Team A" : "Team B";
                                return (
                                    <Panel key={id} title={`In-house ${id}`} level={3} padded={false}
                                           meta={`${winnerTeam} won as ${sideName[winner]}, reported by ${inhouse.reportedBy}`}>
                                        <Teams inhouse={inhouse}/>
                                        {confirming?.id === id && confirming.kind === "approve" ? (
                                            <ConfirmStrip label="Approve result" busy={busy} edge={teamAWon ? "border-l-radiant" : "border-l-dire"}
                                                          onConfirm={() => approveInhouse.mutate(id, done(`In-house ${id} approved. ELO is updated.`))} onBack={() => setConfirming(null)}>
                                                <p>
                                                    <span className={`font-semibold ${teamAWon ? "text-radiant" : "text-dire"}`}>{winnerTeam} won</span>
                                                    <span className="text-ash"> playing {sideName[winner]}</span>
                                                </p>
                                                <p className="mt-0.5 text-sm text-ash">Every player's ELO moves by the change next to their name. This can't be undone.</p>
                                            </ConfirmStrip>
                                        ) : confirming?.id === id && confirming.kind === "reject" ? (
                                            <ConfirmStrip danger label="Reject result" busy={busy}
                                                          onConfirm={() => cancelInhouse.mutate(id, done(`In-house ${id} rejected.`))} onBack={() => setConfirming(null)}>
                                                <p className="text-sm">The in-house is deleted and nobody's ELO changes.</p>
                                            </ConfirmStrip>
                                        ) : (
                                            <div className="mt-1.5 flex flex-wrap justify-end gap-3 border-t border-rule px-1.5 pt-3 pb-1.5">
                                                <button className="secondary-button" disabled={busy} onClick={() => setConfirming({id, kind: "reject"})}>Reject</button>
                                                <button className="primary-button" disabled={busy} onClick={() => setConfirming({id, kind: "approve"})}>Approve</button>
                                            </div>
                                        )}
                                    </Panel>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="px-4 text-ash">No results waiting.</p>
                    )}
                </>
            )}

            <h2 className="mt-10 mb-4 px-4 font-display text-3xl font-bold">In progress</h2>
            {isPending ? (
                <Loader label="Loading in-houses"/>
            ) : isError ? (
                <QueryError message="Couldn't load in-houses."/>
            ) : inhouses.length ? (
                <div className="grid items-start gap-4 lg:grid-cols-2">
                    {inhouses.map(inhouse => {
                        const id = inhouse.id!;
                        // Same rule as the API: only the in-house's own players, or an admin
                        const canFinish = user && (user.admin
                            || [...inhouse.teamA, ...inhouse.teamB].some(player => player.steamId === user.steamId));
                        return (
                            <Panel key={id} title={`In-house ${id}`} level={3} padded={false}
                                   meta={inhouse.createdAt && `Started ${formatRelative(inhouse.createdAt)}`}>
                                <Teams inhouse={inhouse}/>
                                {canFinish && confirming?.id === id && confirming.kind === "report" && (
                                    <ConfirmStrip label="Send result" busy={busy}
                                                  edge={confirming.winner === confirming.teamASide ? "border-l-radiant" : "border-l-dire"}
                                                  onConfirm={() => reportResult.mutate(confirming, done("Result sent. An admin will check it before ELO changes."))} onBack={() => setConfirming(null)}>
                                        <p>
                                            {confirming.winner === confirming.teamASide
                                                ? <span className="font-semibold text-radiant">Team A won</span>
                                                : <span className="font-semibold text-dire">Team B won</span>}
                                            <span className="text-ash"> playing {sideName[confirming.winner]}</span>
                                        </p>
                                        <p className="mt-0.5 text-sm text-ash">An admin checks it before anyone's ELO moves.</p>
                                    </ConfirmStrip>
                                )}
                                {canFinish && confirming?.id === id && confirming.kind === "cancel" && (
                                    <ConfirmStrip danger label="Cancel in-house" busy={busy}
                                                  onConfirm={() => cancelInhouse.mutate(id, done(`In-house ${id} cancelled.`))} onBack={() => setConfirming(null)}>
                                        <p className="text-sm">It's deleted and nobody's ELO changes.</p>
                                    </ConfirmStrip>
                                )}
                                {canFinish && (
                                    <form onSubmit={(e) => report(e, id)} hidden={confirming?.id === id}
                                          className="mt-1.5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-t border-rule px-1.5 pt-3 pb-1.5">
                                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                            {[{name: "won", legend: "Winner"}, {name: "dire", legend: "Played Dire"}].map(({name, legend}) => (
                                                <fieldset key={name}>
                                                    <legend className="text-ash">{legend}</legend>
                                                    <div className="mt-1 flex gap-4">
                                                        {["A", "B"].map(team => (
                                                            <label key={team} className="flex items-center gap-1.5">
                                                                <input type="radio" name={name} value={team} required className="accent-accent"/>
                                                                Team {team}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </fieldset>
                                            ))}
                                        </div>
                                        <div className="ml-auto flex gap-3">
                                            <button type="button" className="secondary-button" disabled={busy} onClick={() => setConfirming({id, kind: "cancel"})}>Cancel</button>
                                            <button type="submit" className="primary-button" disabled={busy}>Send result</button>
                                        </div>
                                    </form>
                                )}
                            </Panel>
                        );
                    })}
                </div>
            ) : (
                <p className="px-4 text-ash">No in-houses in progress.</p>
            )}
            {actionError && <p role="alert" className="mt-2 text-sm text-ash">{actionError.message}</p>}
            {/*Always in the page so screen readers announce each new message; bottom-centred on phones, bottom-right from sm up*/}
            <div role="status" className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-center sm:left-auto sm:justify-end">
                {toast && (
                    <p key={toast.id}
                       className="toast rounded-md border border-rule border-l-3 border-l-win/25 bg-panel-raised px-4 py-3 text-sm shadow-lg shadow-black/40">
                        {toast.message}
                    </p>
                )}
            </div>
        </Page>
    );
}
