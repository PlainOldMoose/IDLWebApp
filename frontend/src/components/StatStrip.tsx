import type {ReactNode} from "react";

interface Stat {
    label: string;
    value: ReactNode;
}

// A single row of figures split by dividers; keep it to three so it fits a phone.
// Long labels wrap; justify-end (the top, as the column is reversed) keeps the figures level when one does
export default function StatStrip({stats}: { stats: Stat[] }) {
    return (
        <dl className="flex divide-x divide-rule">
            {stats.map(stat => (
                <div key={stat.label} className="flex min-w-0 flex-1 flex-col-reverse items-center justify-end gap-0.5 px-2 text-center">
                    <dt className="max-w-full text-balance wrap-break-word text-sm text-ash">{stat.label}</dt>
                    <dd className="figures text-xl font-semibold">{stat.value}</dd>
                </div>
            ))}
        </dl>
    );
}
