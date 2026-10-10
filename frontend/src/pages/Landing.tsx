import {Link} from "react-router";
import EloLadder from "../components/EloLadder.tsx";
import MatchSummaryCard from "../components/MatchSummaryCard.tsx";
import Page from "../components/Page.tsx";
import Panel from "../components/Panel.tsx";
import {useCurrentUser, useMatches, usePlayers, useSeasons} from "../services/Queries.ts";
import {formatDateRange} from "../util/format.ts";
import {statusStyles} from "../util/statusStyles.ts";
import type {Season} from "../types.ts";

const RECENT_MATCH_COUNT = 5;

// The season people most likely want: one taking sign-ups or drafting, else one in progress, else the latest (API sends
// newest first)
const pickCurrentSeason = (seasons: Season[]): Season | undefined =>
    seasons.find(s => s.status === "REGISTRATION" || s.status === "DRAFTING")
    ?? seasons.find(s => s.status === "ACTIVE")
    ?? seasons[0];

export default function Landing() {
    const {data: players} = usePlayers();
    const {data: matches} = useMatches();
    const {data: seasons} = useSeasons();
    const {data: user} = useCurrentUser();

    const currentSeason = seasons && pickCurrentSeason(seasons);

    const about = [
        {
            title: "What?",
            body: "This is a (non-vibecoded) web application made by Moose. It tracks and stores IDL data like " +
                "seasons and matches, and formats them into a more readable format.",
        },
        {
            title: "Why?",
            body: "The aim of this project is to replace the back-end currently used by the admins, thus ending Sabata's years of hard work manually entering data into spreadsheets. " +
                "In the future it also seeks to provide features and tools to players of IDL, such as an in-house balancer and our very own doodle.",
        },
        {
            title: "How?", body: <>
                This project is made 100% by hand, using Java Springboot, React/Tailwind, and a PostgreSQL database.
                The project is open source, check out the source code and how to contribute{" "}
                <a href="https://github.com/PlainOldMoose/IDLWebApp" target="_blank" rel="noopener noreferrer"
                   className="font-semibold text-accent underline underline-offset-2 hover:text-bone">here</a>
            </>
        },
    ];

    return (
        <Page title="IDL Web Manager" subtitle="In-house Dota 2 league, UK">
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="min-w-0 space-y-4">
                    {players && players.length > 0 && (
                        <Panel title="Ladder" meta={<Link to="/players" className="hover:text-bone">{players.length} players</Link>}>
                            <EloLadder players={players} highlightSteamId={user?.steamId} highlightLabel="You"/>
                        </Panel>
                    )}
                    {matches && matches.length > 0 && (
                        <Panel title="Recent matches" meta={<Link to="/matches" className="hover:text-bone">See all {matches.length}</Link>}
                               padded={false}>
                            {matches.slice(0, RECENT_MATCH_COUNT).map(match => (
                                <MatchSummaryCard key={match.matchId} match={match}/>
                            ))}
                        </Panel>
                    )}
                </div>

                <aside className="space-y-4">
                    {currentSeason && (
                        <Panel title="Current season">
                            <p className="font-display text-3xl font-bold leading-none">{currentSeason.name}</p>
                            <p className="mt-2 text-sm text-ash">
                                <span className="figures">{formatDateRange(currentSeason.startDate, currentSeason.endDate)}</span>
                                <span className={`ml-3 font-medium ${statusStyles[currentSeason.status].text}`}>
                                    {statusStyles[currentSeason.status].label}
                                </span>
                            </p>
                            <Link to={`/seasons/${currentSeason.id}`}
                                  className={`mt-4 w-full justify-center ${currentSeason.status === "REGISTRATION" ? "primary-button" : "secondary-button"}`}>
                                {currentSeason.status === "REGISTRATION" ? "View and sign up" : "View season"}
                            </Link>
                        </Panel>
                    )}
                    <Panel title="About">
                        <div className="space-y-4">
                            {about.map(({title, body}) => (
                                <div key={title}>
                                    <h3 className="font-semibold">{title}</h3>
                                    <p className="mt-1 leading-relaxed text-ash">{body}</p>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </aside>
            </div>
        </Page>
    );
}
