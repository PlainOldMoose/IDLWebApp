import Page from "../components/Page.tsx";

export default function Unregistered() {
    return (
        <Page title="Oops! You don't exist?!">
            <p className="max-w-2xl text-lg leading-relaxed text-ash">
                It appears your steam account is not registered to play in IDL, please contact an admin to sign up for our league.
            </p>
        </Page>
    );
}
