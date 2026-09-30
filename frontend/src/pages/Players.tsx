import {Link, useSearchParams} from "react-router-dom";
import {useCurrentUser, usePlayers} from "../services/Queries.ts";
import Page from "../components/Page.tsx";
import Panel from "../components/Panel.tsx";
import StatStrip from "../components/StatStrip.tsx";
import EloLadder from "../components/EloLadder.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";
import {formatElo} from "../util/format.ts";

export default function Players() {
    // Highest ELO first, as the API returns them, so position is rank
    const {data: players, isPending, isError} = usePlayers();
    const {data: user} = useCurrentUser();
    // The search lives in the URL (?q=) so a filtered list can be shared or bookmarked
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get("q") ?? "";

    const header = {title: "Players", aside: <button className="primary-button">Add player</button>};
    if (isPending) return <Page {...header}><Loader label="Loading players"/></Page>;
    if (isError) return <Page {...header}><QueryError message="Couldn't load players."/></Page>;

    const query = search.trim().toLowerCase();
    const visible = players
        .map((player, index) => ({player, rank: index + 1}))
        .filter(({player}) => player.username.toLowerCase().includes(query));

    const yourRank = players.findIndex(p => p.steamId === user?.steamId) + 1;
    const median = players.length ? players[Math.floor(players.length / 2)].elo : 0;

    return (
        <Page {...header} subtitle={`${players.length} players, ranked by ELO`}>
            <Panel title="Ladder" meta="Hover to see who, click to open their page" className="mb-4">
                <EloLadder players={players} highlightSteamId={user?.steamId} highlightLabel="You"/>
            </Panel>

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <Panel title="Rankings" padded={false} meta={
                    <>
                        <label htmlFor="player-search" className="sr-only">Find a player</label>
                        <input
                            id="player-search"
                            type="search"
                            name="q"
                            autoComplete="off"
                            spellCheck={false}
                            value={search}
                            onChange={(e) => setSearchParams(e.target.value ? {q: e.target.value} : {}, {replace: true})}
                            placeholder="Find a player…"
                            className="w-52 rounded-md border border-ash/65 bg-night px-3 py-1.5 text-bone placeholder:text-ash focus:border-accent"
                        />
                    </>
                }>
                    <div aria-hidden="true" className="grid grid-cols-[3rem_1fr_auto] gap-x-4 px-3 pt-1.5 pb-2 text-sm text-ash">
                        <p className="text-right">Rank</p>
                        <p>Player</p>
                        <p className="text-right">ELO</p>
                    </div>
                    <ol>
                        {visible.map(({player, rank}) => {
                            const isYou = player.steamId === user?.steamId;
                            return (
                                <li key={player.steamId}>
                                    <Link to={`/players/${player.steamId}`}
                                          className={`row-link grid grid-cols-[3rem_1fr_auto] gap-x-4 px-3 py-2 ${isYou ? "bg-panel-raised" : ""}`}>
                                        <span className="figures text-right text-ash">{rank}</span>
                                        <span className="truncate">
                                            {player.username}
                                            {isYou && <span className="ml-2 text-sm font-medium text-accent">You</span>}
                                        </span>
                                        <span className="figures text-right">{formatElo(player.elo)}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ol>
                    {visible.length === 0 && (
                        <p className="px-3 py-6 text-ash">No players match “{search.trim()}”. Check the spelling or try part of the name.</p>
                    )}
                </Panel>

                <aside className="space-y-4">
                    {yourRank > 0 && (
                        <Panel title="Your standing">
                            <StatStrip stats={[
                                {label: "Rank", value: yourRank},
                                {label: "ELO", value: formatElo(players[yourRank - 1].elo)},
                                {label: "Percentile", value: `Top ${Math.ceil((yourRank / players.length) * 100)}%`},
                            ]}/>
                        </Panel>
                    )}
                    <Panel title="League">
                        <StatStrip stats={[
                            {label: "Players", value: players.length},
                            {label: "Median", value: formatElo(median)},
                            {label: "Highest", value: players.length ? formatElo(players[0].elo) : "None"},
                        ]}/>
                    </Panel>
                </aside>
            </div>
        </Page>
    );
}
