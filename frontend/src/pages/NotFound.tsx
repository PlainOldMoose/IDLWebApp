import Page from "../components/Page.tsx";
import QueryError from "../components/QueryError.tsx";

export default function NotFound() {
    return (
        <Page title="Page not found">
            <QueryError
                message="There's nothing at this address."
                detail="The link may be wrong, or the page may not have been built yet."
            />
        </Page>
    );
}
