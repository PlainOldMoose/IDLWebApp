import {type ReactNode, useId} from "react";

interface PanelProps {
    title: ReactNode;
    meta?: ReactNode;
    children: ReactNode;
    className?: string;
    padded?: boolean;
    // Heading level for the title; 3 when the panel sits under another section heading
    level?: 2 | 3;
    // Anchor target, e.g. for an in-page "jump to" link
    id?: string;
}

export default function Panel({title, meta, children, className = "", padded = true, level = 2, id}: PanelProps) {
    const Heading = level === 3 ? "h3" : "h2";
    const headingId = useId();
    return (
        <section id={id} aria-labelledby={headingId} className={`overflow-hidden rounded-lg bg-panel ${className}`}>
            <header className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-rule px-4 py-2.5">
                <Heading id={headingId} className="text-lg font-semibold">{title}</Heading>
                {meta && <div className="text-sm text-ash">{meta}</div>}
            </header>
            <div className={padded ? "p-4" : "p-1.5"}>{children}</div>
        </section>
    );
}
