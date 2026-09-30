import type {ReactNode} from "react";
import {WarningCircle} from "@phosphor-icons/react";

interface QueryErrorProps {
    message: string;
    detail?: ReactNode;
}

export default function QueryError({message, detail}: QueryErrorProps) {
    return (
        <div role="alert" className="flex gap-3 rounded-lg border border-blood bg-blood/30 p-4">
            <WarningCircle aria-hidden="true" size={20} className="mt-0.5 shrink-0"/>
            <div>
                <p className="font-semibold">{message}</p>
                <div className="mt-1 text-bone/80">
                    {detail ?? "Check your connection and refresh the page. If it keeps happening, tell an admin."}
                </div>
            </div>
        </div>
    );
}
