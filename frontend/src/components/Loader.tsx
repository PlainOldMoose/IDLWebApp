interface LoaderProps {
    label: string;
}

export default function Loader({label}: LoaderProps) {
    return (
        <p role="status" className="py-24 text-center text-ash">{label}…</p>
    );
}
