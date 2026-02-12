import type {Season} from "../types/Season.ts";

interface SeasonSummaryCardProps {
    season: Season;
    onClick?: () => void;
}

export default function SeasonSummaryCard({season, onClick}: SeasonSummaryCardProps) {
    const statusBadgeStyles: Record<Season["status"], string> = {
        REGISTRATION: "text-surface-a10 bg-primary-a20",
        ACTIVE: "text-surface-a10 bg-warning",
        COMPLETED: "text-light-a10 bg-danger",
    };

    return (
        <div className={`season-summary-card ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
            <p className="font-bold">{season.name}</p>
            <span
                className={`justify-self-end text-xs font-semibold px-2 py-1 rounded-full w-fit ${statusBadgeStyles[season.status]}`}>{season.status}
            </span>
            <p className="text-light-a20">Start Date: {new Date(season.startDate).toLocaleDateString("en-GB")}</p>
        </div>
    );
}