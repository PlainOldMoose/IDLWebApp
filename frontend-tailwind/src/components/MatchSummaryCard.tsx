import type {MatchSummary} from "../types/Match.ts"

interface MatchSummaryCardProps {
    match: MatchSummary;
    onClick?: () => void;
}

export default function MatchSummaryCard({match, onClick}: MatchSummaryCardProps) {
    return (
        <div className="flex justify-between bg-surface-a20 rounded-xl p-6 mt-4">
            <p>Match: {match.matchId}</p>
            <p>Winner: {match.winner}</p>
            <p>Time Played: {match.timePlayed}</p>
            <p>Avg Elo: {match.avgElo}</p>
            <p>Season Name: {match.seasonName}</p>
        </div>
    );
}