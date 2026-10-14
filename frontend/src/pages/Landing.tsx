import {Link} from "react-router";
import EloLadder from "../components/EloLadder.tsx";
import MatchSummaryCard from "../components/MatchSummaryCard.tsx";
import Page from "../components/Page.tsx";
import Panel from "../components/Panel.tsx";
import {useCurrentUser, usePlayers, useRecentMatches, useSeasons} from "../services/Queries.ts";
import {formatDateRange} from "../util/format.ts";
import {statusStyles} from "../util/statusStyles.ts";
import type {Season} from "../types.ts";

const RECENT_MATCH_COUNT = 6;
const HALL_OF_FAME_COUNT = 5;

// The season people most likely want: one taking sign-ups or drafting, else one in progress, else the latest (API sends
// newest first)
const pickCurrentSeason = (seasons: Season[]): Season | undefined =>
    seasons.find(s => s.status === "REGISTRATION" || s.status === "DRAFTING")
    ?? seasons.find(s => s.status === "ACTIVE")
    ?? seasons[0];

export default function Landing() {
    const {data: players} = usePlayers();
    const {data: matches} = useRecentMatches(RECENT_MATCH_COUNT);
    const {data: seasons} = useSeasons();
    const {data: user} = useCurrentUser();

    const currentSeason = seasons && pickCurrentSeason(seasons);
    const champions = seasons?.filter(s => s.winnerTeamName);

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
            {/*Bands of paired panels, so neither column runs on alone. Season first, so phones see it before the ladder*/}
            <div className="space-y-4">
                {/*A lone panel takes the full width rather than leaving its partner's column empty*/}
                <div className={`grid gap-4 ${players?.length ? "lg:grid-cols-[20rem_minmax(0,1fr)]" : ""}`}>
                    <Panel title="Current season">
                        {currentSeason ? (<>
                            <p className="font-display text-3xl font-bold leading-none">{currentSeason.name}</p>
                            <p className="mt-2 text-sm text-ash">
                                <span className="figures">{formatDateRange(currentSeason.startDate, currentSeason.endDate)}</span>
                                <span className={`ml-3 font-medium ${statusStyles[currentSeason.status].text}`}>
                                    {statusStyles[currentSeason.status].label}
                                </span>
                            </p>
                        </>) : seasons && (
                            <p className="text-ash">No seasons yet. The first one appears here when an admin creates it.</p>
                        )}
                        <div className="mt-4 grid gap-2">
                            {currentSeason && (
                                <Link to={`/seasons/${currentSeason.id}`}
                                      className={`justify-center ${currentSeason.status === "REGISTRATION" ? "primary-button" : "secondary-button"}`}>
                                    {currentSeason.status === "REGISTRATION" ? "View and sign up" : "View season"}
                                </Link>
                            )}
                            <Link to="/rules" className="secondary-button justify-center">Read the rules</Link>
                        </div>
                    </Panel>
                    {players && players.length > 0 && (
                        <Panel title="Ladder" meta={<Link to="/players" className="hover:text-bone">{players.length} players</Link>}>
                            <EloLadder players={players} highlightSteamId={user?.steamId} highlightLabel="You"/>
                        </Panel>
                    )}
                </div>

                <div className={`grid gap-4 ${matches?.length && champions ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : ""}`}>
                    {matches && matches.length > 0 && (
                        <Panel title="Recent matches" meta={<Link to="/matches" className="hover:text-bone">See all matches</Link>}
                               padded={false}>
                            {matches.map(match => (
                                <MatchSummaryCard key={match.matchId} match={match}/>
                            ))}
                        </Panel>
                    )}
                    {champions && (
                        <Panel title="Hall of fame" padded={false}
                               meta={champions.length > HALL_OF_FAME_COUNT &&
                                   <Link to="/seasons" className="hover:text-bone">See all {champions.length}</Link>}>
                            {champions.length ? (
                                <ul>
                                    {champions.slice(0, HALL_OF_FAME_COUNT).map(season => (
                                        <li key={season.id}>
                                            <Link to={`/seasons/${season.id}`} className="row-link block px-2.5 py-2">
                                                <span className="flex items-baseline gap-2">
                                                    <span className="figures shrink-0 text-sm text-ash">{season.name}</span>
                                                    <span className="truncate font-semibold">{season.winnerTeamName}</span>
                                                </span>
                                                {/*Captain first, so the first name is bold*/}
                                                <span className="block truncate text-sm text-ash">
                                                    {season.winnerPlayers?.map((name, i) => i === 0
                                                        ? <span key={i}><strong className="font-bold">{name}</strong><span className="sr-only"> (captain)</span></span>
                                                        : `, ${name}`)}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="p-2.5 text-ash">No champions yet. Winners appear here when a season ends.</p>
                            )}
                        </Panel>
                    )}
                </div>

                <Panel title="About">
                    <div className="grid gap-x-8 gap-y-4 md:grid-cols-3">
                        {about.map(({title, body}) => (
                            <div key={title}>
                                <h3 className="font-semibold">{title}</h3>
                                <p className="mt-1 leading-relaxed text-ash">{body}</p>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>
        </Page>
    );
}
