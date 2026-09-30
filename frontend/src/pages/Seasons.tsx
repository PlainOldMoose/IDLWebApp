import {Link} from "react-router-dom";
import {useSeasons} from "../services/Queries.ts";
import Page from "../components/Page.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";
import {formatDateRange} from "../util/format.ts";
import {statusLabels, statusNodeStyles, statusTextStyles} from "../util/statusStyles.ts";

export default function Seasons() {
    const {data: seasons, isLoading, isError} = useSeasons();

    if (isLoading) return <Page title="Seasons"><Loader label="Loading seasons"/></Page>;
    if (isError) return <Page title="Seasons"><QueryError message="Couldn't load seasons."/></Page>;

    const newestFirst = [...(seasons ?? [])].sort((a, b) => b.startDate.localeCompare(a.startDate));

    return (
        <Page title="Seasons" subtitle={`${newestFirst.length} seasons, newest first`}>
            {newestFirst.length ? (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {newestFirst.map((season) => (
                        <li key={season.id}>
                            <Link to={`/seasons/${season.id}`}
                                  className="block rounded-lg bg-panel p-5 transition-colors hover:bg-panel-raised">
                                <p className={`flex items-center gap-2 text-sm font-medium ${statusTextStyles[season.status]}`}>
                                    <span aria-hidden="true" className={`size-2.5 rounded-full border-2 ${statusNodeStyles[season.status]}`}/>
                                    {statusLabels[season.status]}
                                </p>
                                <h2 className="mt-3 font-display text-4xl font-bold leading-none">{season.name}</h2>
                                <p className="figures mt-2 text-ash">{formatDateRange(season.startDate, season.endDate)}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-ash">No seasons yet. The first one appears here when an admin creates it.</p>
            )}
        </Page>
    );
}
