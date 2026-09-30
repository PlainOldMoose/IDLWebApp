import type {ReactNode} from "react";

interface Stat {
    label: string;
    value: ReactNode;
}

// A single row of figures split by dividers; keep it to three so it fits a phone
export default function StatStrip({stats}: { stats: Stat[] }) {
    return (
        <dl className="flex divide-x divide-rule">
            {stats.map(stat => (
                <div key={stat.label} className="flex min-w-0 flex-1 flex-col-reverse items-center gap-0.5 px-2 text-center">
                    <dt className="whitespace-nowrap text-sm text-ash">{stat.label}</dt>
                    <dd className="figures text-xl font-semibold">{stat.value}</dd>
                </div>
            ))}
        </dl>
    );
}
