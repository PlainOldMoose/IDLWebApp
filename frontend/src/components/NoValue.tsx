// A dash in place of a missing value. Screen readers get the label instead, so it's never a bare dash
export default function NoValue({label}: { label: string }) {
    return <><span aria-hidden="true">&ndash;</span><span className="sr-only">{label}</span></>;
}
