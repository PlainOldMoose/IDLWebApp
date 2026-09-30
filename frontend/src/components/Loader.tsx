interface LoaderProps {
    label: string;
}

// Pixel-art Roshan made by a community member. Expects the gif at public/roshan.gif
export default function Loader({label}: LoaderProps) {
    return (
        <div role="status" className="flex flex-col items-center gap-3 py-24 text-ash">
            {/*A gif can't be paused, so it's hidden for people who ask for reduced motion*/}
            <img src="/roshan.gif" alt="" width={64} height={64}
                 onError={(event) => { event.currentTarget.hidden = true; }}
                 className="h-16 w-auto [image-rendering:pixelated] motion-reduce:hidden"/>
            <p>{label}…</p>
        </div>
    );
}
