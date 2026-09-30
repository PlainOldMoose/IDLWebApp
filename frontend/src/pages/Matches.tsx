import {useMatches} from "../services/Queries.ts";
import MatchSummaryCard, {matchColumns} from "../components/MatchSummaryCard.tsx";
import Page from "../components/Page.tsx";
import Panel from "../components/Panel.tsx";
import StatStrip from "../components/StatStrip.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";

export default function Matches() {
    // Newest first, as the API returns them
    const {data: matches, isPending, isError} = useMatches();

    if (isPending) return <Page title="Matches"><Loader label="Loading matches"/></Page>;
    if (isError) return <Page title="Matches"><QueryError message="Couldn't load matches."/></Page>;

    const radiantWins = matches.filter(m => m.winner === "RADIANT").length;
    const direWins = matches.length - radiantWins;
    const seasonMatches = matches.filter(m => m.seasonName).length;

    return (
        <Page title="Matches" subtitle={`${matches.length} matches recorded`}>
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <Panel title="All matches" meta="Winners in bold. Opens on Stratz." padded={false} className="min-w-0">
                    {matches.length ? (
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
                            {matches.map((match) => (
                                <MatchSummaryCard key={match.matchId} match={match}/>
                            ))}
                        </>
                    ) : (
                        <p className="p-3 text-ash">No matches recorded yet.</p>
                    )}
                </Panel>

                {matches.length > 0 && (
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
                        <Panel title="Match types">
                            <StatStrip stats={[
                                {label: "Season", value: seasonMatches},
                                {label: "In-house", value: matches.length - seasonMatches},
                            ]}/>
                        </Panel>
                    </aside>
                )}
            </div>
        </Page>
    );
}
