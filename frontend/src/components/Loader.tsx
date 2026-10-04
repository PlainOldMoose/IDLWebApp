// Baby Roshan, silhouetted against the same oxblood glow as the page header. The sprite is 32px art scaled 4x.
export default function Loader({label}: { label: string }) {
    return (
        <div role="status" className="flex flex-col items-center py-14 text-ash">
            <picture className="block p-6 bg-radial from-blood/60 to-transparent to-65%">
                <source srcSet="/rosh-still.png" media="(prefers-reduced-motion: reduce)"/>
                <img src="/rosh.gif" alt="" width={128} height={128} className="[image-rendering:pixelated]"/>
            </picture>
            <p>{label}…</p>
        </div>
    );
}
