import Page from "../components/Page.tsx";

export default function Disabled() {
    return (
        <Page title="Account disabled">
            <p className="max-w-2xl text-lg leading-relaxed text-ash">
                Your account has been disabled, so you can't sign in. If you think this is a mistake or want to play again, contact an admin.
            </p>
        </Page>
    );
}
