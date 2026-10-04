import {useSearchParams} from "react-router";
import {useMatches} from "../services/Queries.ts";
import MatchSummaryCard, {matchColumns} from "../components/MatchSummaryCard.tsx";
import Page from "../components/Page.tsx";
import Panel from "../components/Panel.tsx";
import StatStrip from "../components/StatStrip.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";

const PAGE_SIZE = 50;

export default function Matches() {
    // Newest first, as the API returns them.
    // NOTE: filters and pages the whole list in the browser, move paging to the API if matches reach the tens of thousands
    const {data: matches, isPending, isError} = useMatches();
    // Filters and page live in the URL so a filtered view can be shared and the back button pages back
    const [searchParams, setSearchParams] = useSearchParams();
    const season = searchParams.get("season") ?? "";
    const team = searchParams.get("team") ?? "";
    const oldestFirst = searchParams.get("sort") === "oldest";

    // A filter change drops ?page, back to the first page, in place; paging adds a history entry so back pages back
    const setParam = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "page") next.delete("page");
        setSearchParams(next, {replace: key !== "page"});
    };
    const goToPage = (page: number) => {
        setParam("page", String(page));
        window.scrollTo({top: 0});
    };

    if (isPending) return <Page title="Matches"><Loader label="Loading matches"/></Page>;
    if (isError) return <Page title="Matches"><QueryError message="Couldn't load matches."/></Page>;

    // Seasons that have matches, newest first; a Map keeps the first (newest) occurrence's order
    const seasons = [...new Map(matches.filter(m => m.seasonId).map(m => [m.seasonId, m.seasonName])).entries()];

    // In-houses have no teams, so the team search sits out
    const inhouses = season === "inhouse";
    const query = inhouses ? "" : team.trim().toLowerCase();
    const filtered = matches.filter(m =>
        (!season || (inhouses ? !m.seasonId : m.seasonId === season))
        && (!query || [m.radiantTeamName, m.direTeamName].some(name => name?.toLowerCase().includes(query))));
    if (oldestFirst) filtered.reverse();

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const page = Math.min(Math.max(1, Number(searchParams.get("page")) || 1), pageCount);
    const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const radiantWins = filtered.filter(m => m.winner === "RADIANT").length;
    const direWins = filtered.length - radiantWins;
    const seasonMatches = filtered.filter(m => m.seasonName).length;

    // The panel is titled after the matches it lists
    const title = inhouses ? "In-houses" : seasons.find(([id]) => id === season)?.[1] ?? "All matches";
    const first = (page - 1) * PAGE_SIZE + 1;

    // Full width on phones, where the header wraps them under the title
    const filters = (
        <div className="flex flex-wrap gap-2">
            <select value={season} onChange={(e) => setParam("season", e.target.value)} aria-label="Season" className="text-input w-full sm:w-auto">
                <option value="">All matches</option>
                <option value="inhouse">In-houses</option>
                {seasons.map(([id, name]) => <option key={id} value={id ?? ""}>{name}</option>)}
            </select>
            <input type="search" value={inhouses ? "" : team} disabled={inhouses} onChange={(e) => setParam("team", e.target.value)}
                   aria-label="Find a team" placeholder="Find a team…" autoComplete="off" spellCheck={false}
                   className="text-input min-w-0 flex-1 sm:w-44 sm:flex-none"/>
            <select value={oldestFirst ? "oldest" : ""} onChange={(e) => setParam("sort", e.target.value)} aria-label="Order" className="text-input">
                <option value="">Newest first</option>
                <option value="oldest">Oldest first</option>
            </select>
        </div>
    );

    return (
        <Page title="Matches" subtitle={`${matches.length} matches recorded`}>
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <Panel title={title} meta={matches.length > 0 && filters} padded={false} className="min-w-0">
                    {!matches.length ? (
                        <p className="p-3 text-ash">No matches recorded yet.</p>
                    ) : !filtered.length ? (
                        <div className="flex flex-wrap items-center gap-3 p-3">
                            <p className="text-ash">
                                {query ? `No teams match “${team.trim()}”${season ? ` in ${title}` : ""}. Check the spelling or try part of the name.` : "No matches fit these filters."}
                            </p>
                            <button className="secondary-button" onClick={() => setSearchParams({})}>Clear filters</button>
                        </div>
                    ) : (
                        <>
                            {/*Column headings, hidden on small screens where the rows stack*/}
                            <div aria-hidden="true" className={`hidden gap-x-3 border-b border-rule px-3 pb-2 text-sm text-ash md:grid ${matchColumns}`}>
                                <p className="text-right">Radiant</p>
                                <span className="w-0.5"/>
                                <p>Dire</p>
                                <p className="text-right">Played</p>
                                <p className="text-right">Avg ELO</p>
                                <p className="text-right">Season</p>
                            </div>
                            {shown.map((match) => (
                                <MatchSummaryCard key={match.matchId} match={match}/>
                            ))}
                            {pageCount > 1 && (
                                <nav aria-label="Pages" className="flex items-center justify-between gap-3 border-t border-rule px-3 pt-3 pb-1.5">
                                    {/*Named for where they go in time, which flips with the order*/}
                                    <button className="secondary-button" disabled={page === 1} onClick={() => goToPage(page - 1)}>
                                        {oldestFirst ? "Older" : "Newer"}
                                    </button>
                                    <p className="figures text-sm text-ash">
                                        {first}–{first + shown.length - 1} of {filtered.length}
                                    </p>
                                    <button className="secondary-button" disabled={page === pageCount} onClick={() => goToPage(page + 1)}>
                                        {oldestFirst ? "Newer" : "Older"}
                                    </button>
                                </nav>
                            )}
                        </>
                    )}
                </Panel>

                {filtered.length > 0 && (
                    <aside className="space-y-4">
                        <Panel title="Wins by side">
                            <div className="flex justify-between text-sm">
                                <p><span className="figures text-xl font-semibold">{radiantWins}</span> <span className="text-ash">Radiant</span></p>
                                <p><span className="text-ash">Dire</span> <span className="figures text-xl font-semibold">{direWins}</span></p>
                            </div>
                            <div aria-hidden="true" className="mt-2 flex h-2 gap-0.5">
                                <div className="rounded-l-full bg-radiant" style={{flexGrow: radiantWins}}/>
                                <div className="rounded-r-full bg-dire" style={{flexGrow: direWins}}/>
                            </div>
                        </Panel>
                        {/*A one-type view would just split into all and none*/}
                        {!season && (
                            <Panel title="Match types">
                                <StatStrip stats={[
                                    {label: "Season", value: seasonMatches},
                                    {label: "In-house", value: filtered.length - seasonMatches},
                                ]}/>
                            </Panel>
                        )}
                    </aside>
                )}
            </div>
        </Page>
    );
}
