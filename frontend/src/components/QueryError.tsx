import type {ReactNode} from "react";

interface QueryErrorProps {
    message: string;
    detail?: ReactNode;
}

export default function QueryError({message, detail}: QueryErrorProps) {
    return (
        <div role="alert" className="flex gap-3 rounded-lg border border-blood bg-blood/30 p-4">
            {/*Phosphor's WarningCircle*/}
            <svg aria-hidden="true" width={20} height={20} viewBox="0 0 256 256" fill="currentColor" className="mt-0.5 shrink-0">
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"/>
            </svg>
            <div>
                <p className="font-semibold">{message}</p>
                <div className="mt-1 text-bone/80">
                    {detail ?? "Check your connection and refresh the page. If it keeps happening, tell an admin."}
                </div>
            </div>
        </div>
    );
}
