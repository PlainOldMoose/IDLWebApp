import {type FormEvent, useRef, useState} from "react";
import {Link} from "react-router";
import {useCreateSeason, useCurrentUser, useSeasons} from "../services/Queries.ts";
import Page from "../components/Page.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";
import {formatDateRange} from "../util/format.ts";
import {statusStyles} from "../util/statusStyles.ts";

export default function Seasons() {
    // Newest first, as the API returns them
    const {data: seasons, isPending, isError} = useSeasons();
    const {data: user} = useCurrentUser();
    const createSeason = useCreateSeason();
    const dialogRef = useRef<HTMLDialogElement>(null);
    // Tracked so the end date can't be picked before it
    const [startDate, setStartDate] = useState("");

    const openDialog = () => {
        createSeason.reset();
        dialogRef.current?.showModal();
    };

    const handleCreate = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        createSeason.mutate({
            name: String(data.get("name")).trim(),
            startDate: String(data.get("startDate")),
            endDate: String(data.get("endDate")),
        }, {
            onSuccess: () => {
                form.reset();
                setStartDate("");
                dialogRef.current?.close();
            }
        });
    };

    const inputClass = "text-input mt-2 block w-full";

    // Only admins get the button; the API enforces the same rule
    const header = {
        title: "Seasons",
        aside: user?.admin && (
            <>
                <button className="primary-button" onClick={openDialog}>New season</button>
                <dialog ref={dialogRef} aria-labelledby="new-season-title"
                        className="m-auto w-full max-w-md rounded-lg bg-panel p-6 text-bone backdrop:bg-black/60">
                    <h2 id="new-season-title" className="font-display text-3xl font-bold">New season</h2>
                    <form onSubmit={handleCreate} className="mt-4 space-y-4">
                        <label className="block">
                            Name
                            <input name="name" required maxLength={64} autoComplete="off" className={inputClass}/>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                Starts
                                <input name="startDate" type="date" required value={startDate}
                                       onChange={(e) => setStartDate(e.target.value)} className={inputClass}/>
                            </label>
                            <label className="block">
                                Ends
                                <input name="endDate" type="date" required min={startDate || undefined} className={inputClass}/>
                            </label>
                        </div>
                        {createSeason.isError && <p role="alert" className="text-sm text-ash">Couldn't create the season. Refresh and try again.</p>}
                        <div className="flex justify-end gap-3">
                            <button type="button" className="secondary-button" onClick={() => dialogRef.current?.close()}>Cancel</button>
                            <button className="primary-button" disabled={createSeason.isPending}>Create</button>
                        </div>
                    </form>
                </dialog>
            </>
        ),
    };

    if (isPending) return <Page {...header}><Loader label="Loading seasons"/></Page>;
    if (isError) return <Page {...header}><QueryError message="Couldn't load seasons."/></Page>;

    return (
        <Page {...header} subtitle={`${seasons.length} seasons, newest first`}>
            {seasons.length ? (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {seasons.map((season) => (
                        <li key={season.id}>
                            <Link to={`/seasons/${season.id}`}
                                  className="block rounded-lg bg-panel p-5 transition-colors hover:bg-panel-raised">
                                <p className={`flex items-center gap-2 text-sm font-medium ${statusStyles[season.status].text}`}>
                                    <span aria-hidden="true" className={`size-2.5 rounded-full border-2 ${statusStyles[season.status].node}`}/>
                                    {statusStyles[season.status].label}
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
