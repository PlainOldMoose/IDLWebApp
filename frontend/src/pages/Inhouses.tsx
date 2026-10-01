import {type FormEvent, useState} from "react";
import {useNavigate} from "react-router";
import {
    useCancelInhouse,
    useCreateInhouse,
    useCurrentUser,
    useInhouseBalance,
    useInhouseResult,
    useInhouses,
    usePlayers
} from "../services/Queries.ts";
import type {Inhouse, PlayerSummary} from "../types.ts";
import Page from "../components/Page.tsx";
import Panel from "../components/Panel.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";
import {formatElo, formatRelative} from "../util/format.ts";

const average = (team: PlayerSummary[]) => team.reduce((sum, player) => sum + player.elo, 0) / team.length;

// Radiant's chance to win, the same Elo expectation InhouseService.eloChange uses. 50% is a perfectly even game
const radiantWinChance = (inhouse: Inhouse) => 1 / (1 + 10 ** ((average(inhouse.dire) - average(inhouse.radiant)) / 400));
const percentFormat = new Intl.NumberFormat("en-GB", {style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1});

// Radiant and Dire side by side, each with its average ELO. Shared by the balance options and the games in progress
function Teams({inhouse}: { inhouse: Inhouse }) {
    const sides = [
        {name: "Radiant", team: inhouse.radiant, border: "border-radiant"},
        {name: "Dire", team: inhouse.dire, border: "border-dire"},
    ];
    return (
        <div className="grid grid-cols-2 gap-x-3">
            {sides.map(({name, team, border}) => (
                <div key={name} className="min-w-0">
                    <p className={`flex justify-between gap-2 border-l-3 px-2 py-1 text-sm ${border}`}>
                        <span className="font-semibold">{name}</span>
                        <span className="figures text-ash">{formatElo(average(team))}<span className="sr-only"> average ELO</span></span>
                    </p>
                    <ul className="mt-1">
                        {team.map(player => (
                            <li key={player.steamId} className="flex justify-between gap-2 px-2 py-1">
                                <span className="truncate">{player.username}</span>
                                <span className="figures text-ash">{formatElo(player.elo)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

export default function Inhouses() {
    // Newest first, as the API returns them
    const {data: inhouses, isPending, isError} = useInhouses();
    const {data: user} = useCurrentUser();
    const {data: players} = usePlayers();
    // Steam IDs picked for the balancer, in the order they were added
    const [chosen, setChosen] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const balance = useInhouseBalance(chosen);
    const createInhouse = useCreateInhouse();
    const reportResult = useInhouseResult();
    const cancelInhouse = useCancelInhouse();
    const navigate = useNavigate();

    const byId = new Map(players?.map(player => [player.steamId, player] as const));
    const searchMatch = players?.find(player =>
        player.username.toLowerCase() === search.trim().toLowerCase() && !chosen.includes(player.steamId));
    const busy = reportResult.isPending || cancelInhouse.isPending;

    const addPlayer = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!searchMatch) return;
        setChosen([...chosen, searchMatch.steamId]);
        setSearch("");
    };

    const startInhouse = (option: Inhouse) => {
        createInhouse.mutate({
            radiant: option.radiant.map(player => player.steamId),
            dire: option.dire.map(player => player.steamId),
        }, {onSuccess: () => setChosen([])});
    };

    // The match takes the in-house's ID, so the result page is known up front
    const report = (id: number, winner: "RADIANT" | "DIRE") => {
        const side = winner === "RADIANT" ? "Radiant" : "Dire";
        if (!globalThis.confirm(`Record a ${side} win for in-house ${id}? Everyone's ELO changes, and it can't be undone.`)) return;
        reportResult.mutate({id, winner}, {onSuccess: () => navigate(`/matches/${id}`)});
    };

    const cancel = (id: number) => {
        if (globalThis.confirm(`Cancel in-house ${id}? Nobody's ELO changes.`)) cancelInhouse.mutate(id);
    };

    return (
        <Page title="In-houses" subtitle="Pick 10 players, pick the most even teams, then record who won.">
            {user ? (
                <>
                    <Panel title="Balance teams" meta={`${chosen.length}/10 players`}>
                        <form onSubmit={addPlayer} className="flex gap-2">
                            <label htmlFor="inhouse-player" className="sr-only">Player to add</label>
                            <input id="inhouse-player" list="inhouse-player-names" value={search}
                                   onChange={(e) => setSearch(e.target.value)} disabled={chosen.length === 10}
                                   autoComplete="off" spellCheck={false} placeholder="Add a player…"
                                   className="text-input w-64 min-w-0"/>
                            <datalist id="inhouse-player-names">
                                {players?.filter(player => !chosen.includes(player.steamId)).map(player => (
                                    <option key={player.steamId} value={player.username}/>
                                ))}
                            </datalist>
                            <button className="secondary-button" disabled={!searchMatch}>Add</button>
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
                                           Radiant {percentFormat.format(radiantWinChance(option))} to win
                                           · {formatElo(Math.abs(average(option.radiant) - average(option.dire)))} apart
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

            <h2 className="mt-10 mb-4 font-display text-3xl font-bold">In progress</h2>
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
                            || [...inhouse.radiant, ...inhouse.dire].some(player => player.steamId === user.steamId));
                        return (
                            <Panel key={id} title={`In-house ${id}`} level={3} padded={false}
                                   meta={inhouse.createdAt && `Started ${formatRelative(inhouse.createdAt)}`}>
                                <Teams inhouse={inhouse}/>
                                {canFinish && (
                                    <div className="mt-1.5 flex flex-wrap justify-end gap-3 border-t border-rule px-1.5 pt-3 pb-1.5">
                                        <button className="secondary-button" disabled={busy} onClick={() => cancel(id)}>Cancel</button>
                                        <button className="primary-button" disabled={busy} onClick={() => report(id, "RADIANT")}>Radiant won</button>
                                        <button className="primary-button" disabled={busy} onClick={() => report(id, "DIRE")}>Dire won</button>
                                    </div>
                                )}
                            </Panel>
                        );
                    })}
                </div>
            ) : (
                <p className="text-ash">No in-houses in progress.</p>
            )}
            {(reportResult.isError || cancelInhouse.isError) && (
                <p role="alert" className="mt-2 text-sm text-ash">Couldn't update the in-house. Refresh and try again.</p>
            )}
        </Page>
    );
}
