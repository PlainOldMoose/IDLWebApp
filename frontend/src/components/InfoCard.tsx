import type {ReactNode} from "react";

interface InfoCardProps {
    title: string;
    body: ReactNode;
}

export default function InfoCard({title, body}: InfoCardProps) {
    return (
        <div className="bg-surface-a20 rounded-xl p-8 mt-4">
            <h1 className="text-xl font-bold mb-4">{title}</h1>
            <p className="text-light-a20">{body}</p>
        </div>
    );
}