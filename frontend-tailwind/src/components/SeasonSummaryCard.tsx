import type {Season} from "../types/Season.ts";

interface SeasonSummaryCardProps {
    season: Season;
    onClick?: () => void;
}

export default function SeasonSummaryCard({season, onClick}: SeasonSummaryCardProps) {
    return (
        <div className="flex flex-col justify-between bg-surface-a20 rounded-2xl p-8 mt-4">
            <p className="font-bold">{season.name}</p>
            <p className="text-light-a20">Status: {season.status}</p>
            <p className="text-light-a20">Start Date: {season.startDate}</p>
        </div>
    );
}