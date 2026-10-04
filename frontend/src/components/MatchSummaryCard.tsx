import {Link} from "react-router";
import type {MatchSummary} from "../types.ts";
import {formatDate} from "../util/format.ts";

// Desktop columns, shared with the column headings Matches and SeasonDetail draw above the rows
export const matchColumns = "md:grid-cols-[1fr_auto_1fr_7rem_5rem_7rem]";

export default function MatchSummaryCard({match}: { match: MatchSummary }) {
    const radiantWon = match.winner === "RADIANT";
    const direWon = match.winner === "DIRE";
    return (
        <Link to={`/matches/${match.matchId}`}
              className={`row-link grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-1 px-3 py-3 ${matchColumns}`}>
            {/*Relative so the clipping also catches the absolutely positioned "(won)", which otherwise widens the page past a long name*/}
            <p className="relative truncate text-right">
                <span className={`border-l-3 pl-2.5 ${radiantWon ? "border-l-radiant font-semibold text-bone" : "border-transparent text-ash"}`}>
                    {match.radiantTeamName ?? "Radiant"}
                </span>
                {radiantWon && <span className="sr-only"> (won)</span>}
            </p>
            <span aria-hidden="true" className="h-6 w-0.5 skew-x-[-20deg] bg-ash/50"/>
            <p className="relative truncate">
                <span className={`border-r-3 pr-2.5 ${direWon ? "border-r-dire font-semibold text-bone" : "border-transparent text-ash"}`}>
                    {match.direTeamName ?? "Dire"}
                </span>
                {direWon && <span className="sr-only"> (won)</span>}
            </p>
            <p className="col-span-3 flex justify-center gap-4 text-sm text-ash md:contents">
                <span className="figures md:text-right">{formatDate(match.timePlayed)}</span>
                <span className="figures md:text-right">
                    {match.avgElo.toLocaleString("en-GB")}<span className="md:sr-only"> avg ELO</span>
                </span>
                <span className="truncate md:text-right">{match.seasonName ?? "In-house"}</span>
            </p>
        </Link>
    );
}
