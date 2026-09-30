const eloFormat = new Intl.NumberFormat("en-GB", {minimumFractionDigits: 1, maximumFractionDigits: 1});
const dayFormat = new Intl.DateTimeFormat("en-GB", {day: "numeric", month: "short", year: "numeric"});
const dayMonthFormat = new Intl.DateTimeFormat("en-GB", {day: "numeric", month: "short"});

export const formatElo = (elo: number): string => eloFormat.format(elo);

// Uses a true minus sign so positive and negative changes line up
export const formatEloChange = (change: number): string =>
    (change > 0 ? "+" : change < 0 ? "−" : "") + eloFormat.format(Math.abs(change));

export const formatDate = (date: string): string => dayFormat.format(new Date(date));

export const formatDateRange = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    return `${(sameYear ? dayMonthFormat : dayFormat).format(startDate)} – ${dayFormat.format(endDate)}`;
};

const relativeFormat = new Intl.RelativeTimeFormat("en-GB", {numeric: "auto"});
const relativeSteps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["minute", 60], ["hour", 24], ["day", 30], ["month", 12], ["year", Infinity],
];

// "2 hours ago", "3 days ago", "last month"
export const formatRelative = (date: string): string => {
    let value = (new Date(date).getTime() - Date.now()) / 60000;
    for (const [unit, size] of relativeSteps) {
        if (Math.abs(value) < size) return relativeFormat.format(Math.round(value), unit);
        value /= size;
    }
    return formatDate(date);
};
