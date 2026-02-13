import type {MatchSummary} from "../types/Match.ts"

interface MatchSummaryCardProps {
    match: MatchSummary;
    onClick?: () => void;
}

export default function MatchSummaryCard({match, onClick}: MatchSummaryCardProps) {
    return (
        <div className="match-summary-card">
            <p>{match.matchId}</p>
            <p>{match.winner}</p>
            <p>{match.timePlayed}</p>
            <p>{match.avgElo}</p>
            <p>{match.seasonName ?? "In-house"}</p>
        </div>
    );
}