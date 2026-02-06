import type {Season} from "../types/Season.ts";

interface SeasonSummaryCardProps {
    season: Season;
    onClick?: () => void;
}

export default function SeasonSummaryCard({season, onClick}: SeasonSummaryCardProps) {
    return (
        <div className="flex justify-between bg-accent rounded-2xl p-8 mt-8">
            <p>Season: {season.name}</p>
            <p>Status: {season.status}</p>
            <p>Start Date: {season.startDate}</p>
        </div>
    );
}