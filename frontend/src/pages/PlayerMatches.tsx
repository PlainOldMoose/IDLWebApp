import {Link, useParams, useSearchParams} from "react-router";
import {usePlayer} from "../services/Queries.ts";
import Page from "../components/Page.tsx";
import Panel from "../components/Panel.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";
import {MatchHistoryRows} from "./PlayerDetail.tsx";

const PAGE_SIZE = 20;

export default function PlayerMatches() {
    const {steamId} = useParams<{ steamId: string }>();
    // The profile's own query: every played match, newest first, so coming from the profile needs no new request
    const {data: player, isPending, isError} = usePlayer(steamId);
    // Filter and page live in the URL so a filtered view can be shared and the back button pages back
    const [searchParams, setSearchParams] = useSearchParams();
    const season = searchParams.get("season") ?? "";

    // A filter change drops ?page, back to the first page, in place; paging adds a history entry so back pages back
    const setSeason = (value: string) => setSearchParams(value ? {season: value} : {}, {replace: true});
    const goToPage = (page: number) => {
        const next = new URLSearchParams(searchParams);
        next.set("page", String(page));
        setSearchParams(next);
        window.scrollTo({top: 0});
    };

    if (isPending) return <Page title="Match history"><Loader label="Loading matches"/></Page>;
    if (isError || !player) return <Page title="Player not found"><QueryError message="Couldn't find this player."/></Page>;

    const matches = player.matches;
    // Seasons the player has a match in, newest first; a Map keeps the first (newest) occurrence's order
    const seasons = [...new Map(matches.flatMap(m => m.seasonId ? [[m.seasonId, m.seasonName] as const] : [])).entries()];
    const hasInhouses = matches.some(m => !m.seasonId);

    const inhouses = season === "inhouse";
    const filtered = matches.filter(m => !season || (inhouses ? !m.seasonId : m.seasonId === season));

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const page = Math.min(Math.max(1, Number(searchParams.get("page")) || 1), pageCount);
    const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const filter = (
        <select value={season} onChange={(e) => setSeason(e.target.value)} aria-label="Season" className="text-input">
            <option value="">All matches</option>
            {hasInhouses && <option value="inhouse">In-houses</option>}
            {seasons.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
    );

    return (
        <Page title={player.username} subtitle={<Link to={`/players/${player.steamId}`} className="transition-colors hover:text-bone">Back to profile</Link>}>
            <Panel title="Match history" meta={matches.length > 0 && filter} padded={false}>
                {!matches.length ? (
                    <p className="p-4 text-ash">No matches recorded yet. Results show up here once an admin enters them.</p>
                ) : !filtered.length ? (
                    <p className="p-4 text-ash">No matches fit this filter.</p>
                ) : (
                    <>
                        <MatchHistoryRows matches={shown}/>
                        <nav aria-label="Pages" className="flex items-center justify-between gap-3 border-t border-rule px-3 pt-3 pb-1.5">
                            <button className="secondary-button" aria-label="Newer" title="Newer" disabled={page === 1} onClick={() => goToPage(page - 1)}>
                                {/*Phosphor's CaretLeft*/}
                                <svg aria-hidden="true" width={16} height={16} viewBox="0 0 256 256" fill="currentColor">
                                    <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/>
                                </svg>
                            </button>
                            <p className="figures text-sm text-ash">Page {page} of {pageCount}</p>
                            <button className="secondary-button" aria-label="Older" title="Older" disabled={page === pageCount} onClick={() => goToPage(page + 1)}>
                                {/*Phosphor's CaretRight*/}
                                <svg aria-hidden="true" width={16} height={16} viewBox="0 0 256 256" fill="currentColor">
                                    <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/>
                                </svg>
                            </button>
                        </nav>
                    </>
                )}
            </Panel>
        </Page>
    );
}
