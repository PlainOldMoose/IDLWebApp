import type {ReactNode} from "react";

interface PageProps {
    title: ReactNode;
    subtitle?: ReactNode;
    aside?: ReactNode;
    children: ReactNode;
}

export default function Page({title, subtitle, aside, children}: PageProps) {
    return (
        <>
            <header className="top-band border-b border-rule">
                <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-8 gap-y-4 px-4 pt-6 pb-5 sm:pt-8 sm:pb-6">
                    <div className="min-w-0">
                        <h1 className="font-display text-5xl font-bold leading-none text-balance wrap-break-word sm:text-6xl">{title}</h1>
                        {/*Bone rather than ash: ash drops to about 4:1 over the header glow*/}
                        {subtitle && <div className="mt-3 text-bone/80">{subtitle}</div>}
                    </div>
                    {aside}
                </div>
            </header>
            <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
        </>
    );
}
