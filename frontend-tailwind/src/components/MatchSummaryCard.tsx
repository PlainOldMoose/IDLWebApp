import type {MatchSummary} from "../types/Match.ts"

interface MatchSummaryCardProps {
    match: MatchSummary;
    onClick?: () => void;
}

const handleRedirect = (matchId: number): void => {
    window.open(`https://stratz.com/matches/${matchId}`, "_blank");
};

export default function MatchSummaryCard({match}: MatchSummaryCardProps) {
    return (
        <div className="match-summary-card hover:cursor-pointer" onClick={() => handleRedirect(match.matchId)}>
            <p>{match.matchId}</p>
            <p>{match.seasonName ? (match.winner === "RADIANT" ? match.radiantTeamName : match.direTeamName) : match.winner}</p>
            <p>{match.timePlayed}</p>
            <p>{match.avgElo}</p>
            <p>{match.seasonName ?? "In-house"}</p>
        </div>
    );
}