import {type FormEvent, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {Trash} from "@phosphor-icons/react";
import {
    useCurrentUser,
    useDeleteSeason,
    useSeasonDetail,
    useSeasonMatches,
    useSeasonSignup,
    useSeasonSignups
} from "../services/Queries.ts";
import MatchSummaryCard, {matchColumns} from "../components/MatchSummaryCard.tsx";
import Page from "../components/Page.tsx";
import Panel from "../components/Panel.tsx";
import StatStrip from "../components/StatStrip.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";
import {statusLabels, statusTextStyles} from "../util/statusStyles.ts";
import {formatDate, formatDateRange, formatElo} from "../util/format.ts";

export default function SeasonDetail() {
    const {seasonId} = useParams<{ seasonId: string }>();
    const {data: season, isPending, isError} = useSeasonDetail(seasonId);
    const {data: signups} = useSeasonSignups(seasonId);
    const {data: user} = useCurrentUser();
    const {data: matches} = useSeasonMatches(seasonId, season?.status !== "REGISTRATION");
    const signup = useSeasonSignup(seasonId);
    const alreadySignedUp = signups?.some(s => s.steamId === user?.steamId);
    const deleteSeason = useDeleteSeason(seasonId);
    const deleteDialogRef = useRef<HTMLDialogElement>(null);
    // The admin has to type "delete" before the button unlocks
    const [confirmText, setConfirmText] = useState("");
    const navigate = useNavigate();

    const handleSignup = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        signup.mutate({
            rolePreference: String(form.get("rolePreference")),
            willingToCaptain: form.has("willingToCaptain"),
        });
    };

    const openDeleteDialog = () => {
        deleteSeason.reset();
        setConfirmText("");
        deleteDialogRef.current?.showModal();
    };

    const handleDelete = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        deleteSeason.mutate(undefined, {onSuccess: () => navigate("/seasons")});
    };

    const signIn = () => {
        globalThis.location.href = `/auth/login?returnTo=${encodeURIComponent(globalThis.location.pathname)}`;
    };

    // A grey bar stands in for the title, at the same height so the banner doesn't jump when data arrives
    if (isPending) return (
        <Page title={<>
            <span aria-hidden="true" className="inline-block h-[0.8em] w-72 max-w-full rounded-md bg-white/10 motion-safe:animate-pulse"/>
            <span className="sr-only">Season</span>
        </>}>
            <Loader label="Loading season"/>
        </Page>
    );
    if (isError) return <Page title="Season not found"><QueryError message="Couldn't find this season."/></Page>;

    const started = season.status === "ACTIVE" || season.status === "COMPLETED";
    const standings = [...season.teams].sort((a, b) => b.wins - a.wins || a.losses - b.losses);
    const captains = signups?.filter(s => s.willingToCaptain).length ?? 0;

    return (
        <Page
            title={season.name}
            subtitle={
                <>
                    <span className="figures">{formatDateRange(season.startDate, season.endDate)}</span>
                    <span className={`ml-4 font-medium ${statusTextStyles[season.status]}`}>{statusLabels[season.status]}</span>
                    {/* Only admins get the button; the API enforces the same rule */}
                    {user?.admin && (
                        <button aria-label="Delete season" title="Delete season" onClick={openDeleteDialog}
                                className="ml-3 cursor-pointer rounded-md p-1 align-middle text-danger transition-colors hover:bg-white/5">
                            <Trash size={20} aria-hidden="true"/>
                        </button>
                    )}
                </>
            }
            aside={
                season.status === "REGISTRATION" ? (
                    <div className="sm:text-right">
                        {user && !alreadySignedUp ? (
                            <form onSubmit={handleSignup} className="grid gap-2 sm:justify-items-end">
                                <label htmlFor="role-preference" className="text-sm text-ash">Your roles, most wanted first</label>
                                {/*Same pattern as SeasonSignupRequest on the backend*/}
                                <input
                                    id="role-preference"
                                    name="rolePreference"
                                    required
                                    pattern="(?!.*([1-5]).*\1)\s*[1-5](\s*(/|>+)\s*[1-5])*\s*"
                                    title="Roles 1 to 5, each once, joined by > or /, e.g. 1 > 2 > 3/4"
                                    autoComplete="off"
                                    spellCheck={false}
                                    placeholder="1 > 2 > 3/4"
                                    aria-describedby="role-hint"
                                    className="w-52 rounded-md border border-ash/65 bg-night px-3 py-1.5 text-bone placeholder:text-ash focus:border-accent"
                                />
                                <p id="role-hint" className="text-sm text-ash">
                                    1 carry · 2 mid · 3 off · 4 soft · 5 hard<br/>
                                    &gt; prefer, / equal
                                </p>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" name="willingToCaptain" className="accent-accent"/>
                                    Willing to captain
                                </label>
                                <button className="primary-button" disabled={signup.isPending}>Sign up</button>
                            </form>
                        ) : (
                            <button className="primary-button" onClick={signIn} disabled={alreadySignedUp}>
                                {user ? "Signed up" : "Sign in with Steam"}
                            </button>
                        )}
                        {signup.isError && <p role="alert" className="mt-2 text-sm text-ash">Sign-up failed. Refresh and try again.</p>}
                    </div>
                ) : season.winnerTeamName && (
                    <div className="border-l-3 border-aegis pl-4">
                        <p className="text-sm text-ash">Champions</p>
                        <p className="font-display text-3xl font-bold text-aegis">{season.winnerTeamName}</p>
                    </div>
                )
            }
        >
            {/*Signups*/}
            {season.status === "REGISTRATION" && (
                <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <Panel title="Signed up" meta={`${signups?.length ?? 0} players`}>
                        {signups?.length ? (
                            <ul className="columns-2 gap-x-4 sm:columns-3">
                                {signups.map((s) => (
                                    <li key={s.steamId}>
                                        <Link to={`/players/${s.steamId}`} className="row-link -mx-2 block truncate px-2 py-1.5">
                                            {s.username}
                                            {s.rolePreference && <span className="ml-2 text-sm text-ash">{s.rolePreference}</span>}
                                            {s.willingToCaptain && <span className="ml-2 text-sm text-ash">captain</span>}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-ash">Nobody has signed up yet.</p>
                        )}
                    </Panel>
                    <Panel title="Sign-ups">
                        <StatStrip stats={[
                            {label: "Players", value: signups?.length ?? 0},
                            {label: "Willing to captain", value: captains},
                        ]}/>
                        <p className="mt-4 border-t border-rule pt-3 text-sm text-ash">
                            The season starts on {formatDate(season.startDate)}.
                        </p>
                    </Panel>
                </div>
            )}

            {started && (
                <>
                    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                        <Panel title="Matches" meta={matches?.length ? `${matches.length} played` : undefined}
                               padded={false} className="min-w-0">
                            {matches?.length ? (
                                <>
                                    {/*Column headings, hidden on small screens where the rows stack*/}
                                    <div aria-hidden="true" className={`hidden gap-x-3 border-b border-rule px-3 pb-2 text-sm text-ash md:grid ${matchColumns}`}>
                                        <p className="text-right">Radiant</p>
                                        <span className="w-0.5"/>
                                        <p>Dire</p>
                                        <p className="text-right">Played</p>
                                        <p className="text-right">Avg ELO</p>
                                        <p className="text-right">Season</p>
                                    </div>
                                    {matches.map((match) => (
                                        <MatchSummaryCard key={match.matchId} match={match}/>
                                    ))}
                                </>
                            ) : (
                                <p className="p-3 text-ash">No matches played yet.</p>
                            )}
                        </Panel>

                        <Panel title="Standings" padded={false}>
                            <div aria-hidden="true" className="grid grid-cols-[1.5rem_1fr_2rem_2rem] gap-x-3 px-3 pt-1.5 pb-2 text-sm text-ash">
                                <p/>
                                <p>Team</p>
                                <p className="text-right">W</p>
                                <p className="text-right">L</p>
                            </div>
                            <ol>
                                {standings.map((team, index) => (
                                    <li key={team.teamId}
                                        className="grid grid-cols-[1.5rem_1fr_2rem_2rem] gap-x-3 rounded-md px-3 py-2">
                                        <span className="figures text-right text-ash">{index + 1}</span>
                                        <span className={`truncate ${team.name === season.winnerTeamName ? "text-aegis" : ""}`}>
                                            {team.name}
                                        </span>
                                        <span className="figures text-right">{team.wins}</span>
                                        <span className="figures text-right text-ash">{team.losses}</span>
                                    </li>
                                ))}
                            </ol>
                        </Panel>
                    </div>

                    <h2 className="mt-10 mb-4 font-display text-3xl font-bold">Teams</h2>
                    <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {season.teams.map((team) => {
                            const captainFirst = [...team.members].sort((a, b) =>
                                Number(b.username === team.captainUsername) - Number(a.username === team.captainUsername));
                            const isChampion = team.name === season.winnerTeamName;
                            return (
                                <Panel key={team.teamId}
                                       title={<span className="font-display text-2xl font-bold">{team.name}</span>}
                                       meta={isChampion
                                           ? <span className="font-medium text-aegis">Champions</span>
                                           : <span className="figures">{team.wins}W {team.losses}L</span>}
                                       className={isChampion ? "ring-1 ring-aegis/70" : ""}
                                       level={3}
                                       padded={false}>
                                    <ul>
                                        {captainFirst.map(member => (
                                            <li key={member.steamId}>
                                                <Link to={`/players/${member.steamId}`}
                                                      className="row-link flex justify-between gap-3 px-3 py-1.5">
                                                    <span className="truncate">
                                                        {member.username}
                                                        {member.username === team.captainUsername &&
                                                            <span className="ml-2 text-sm text-ash">captain</span>}
                                                    </span>
                                                    <span className="figures text-ash">{formatElo(member.elo)}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="figures mt-1.5 flex justify-between border-t border-rule px-3 pt-2 pb-1 text-sm text-ash">
                                        <span>Average ELO</span>
                                        <span>{formatElo(team.avgElo)}</span>
                                    </p>
                                </Panel>
                            );
                        })}
                    </div>
                </>
            )}

            {user?.admin && (
                <dialog ref={deleteDialogRef} aria-labelledby="delete-season-title"
                        className="m-auto w-full max-w-md rounded-lg bg-panel p-6 text-bone backdrop:bg-black/60">
                    <h2 id="delete-season-title" className="font-display text-3xl font-bold">Delete season</h2>
                    <form onSubmit={handleDelete} className="mt-4 space-y-4">
                        <p>This permanently deletes <strong>{season.name}</strong> and its sign-ups.</p>
                        <label className="block">
                            Type <strong>delete</strong> to confirm
                            <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off"
                                   className="mt-1 block w-full rounded-md border border-ash/65 bg-night px-3 py-1.5 text-bone focus:border-accent"/>
                        </label>
                        {deleteSeason.isError && <p role="alert" className="text-sm text-ash">Couldn't delete the season. Seasons with teams or matches can't be deleted.</p>}
                        <div className="flex justify-end gap-3">
                            <button type="button" className="secondary-button" onClick={() => deleteDialogRef.current?.close()}>Cancel</button>
                            <button className="primary-button" disabled={confirmText !== "delete" || deleteSeason.isPending}>Delete season</button>
                        </div>
                    </form>
                </dialog>
            )}
        </Page>
    );
}
