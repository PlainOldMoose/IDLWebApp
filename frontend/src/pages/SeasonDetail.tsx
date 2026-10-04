import {type FormEvent, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router";
import {
    useCreateMatch,
    useCurrentUser,
    useDeleteSeason,
    useMatches,
    usePlayers,
    useSeasonDetail,
    useSeasonSignup,
    useSeasonSignups,
    useWithdrawSignup
} from "../services/Queries.ts";
import MatchSummaryCard, {matchColumns} from "../components/MatchSummaryCard.tsx";
import Page from "../components/Page.tsx";
import Panel from "../components/Panel.tsx";
import StatStrip from "../components/StatStrip.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";
import {statusStyles} from "../util/statusStyles.ts";
import {formatDate, formatDateRange, formatElo} from "../util/format.ts";

export default function SeasonDetail() {
    const {seasonId} = useParams<{ seasonId: string }>();
    const {data: season, isPending, isError} = useSeasonDetail(seasonId);
    // Sign-ups only matter before the season starts, matches only after
    const started = season?.status === "ACTIVE" || season?.status === "COMPLETED";
    const {data: signups} = useSeasonSignups(seasonId, season?.status === "REGISTRATION");
    const {data: user} = useCurrentUser();
    const {data: matches} = useMatches(seasonId, !!seasonId && started);
    const signup = useSeasonSignup(seasonId);
    const withdraw = useWithdrawSignup(seasonId);
    const mySignup = signups?.find(s => s.steamId === user?.steamId);
    const signupDialogRef = useRef<HTMLDialogElement>(null);
    const signupFormRef = useRef<HTMLFormElement>(null);
    const deleteSeason = useDeleteSeason(seasonId);
    const deleteDialogRef = useRef<HTMLDialogElement>(null);
    // The admin has to type "delete" before the button unlocks
    const [confirmText, setConfirmText] = useState("");
    const navigate = useNavigate();
    // Admins can add a game the league ticket missed, while the season is active
    const canAddMatch = !!user?.admin && season?.status === "ACTIVE";
    const createMatch = useCreateMatch();
    const {data: players} = usePlayers(canAddMatch);
    const addMatchDialogRef = useRef<HTMLDialogElement>(null);
    // Picking a team fills its side with the roster
    const [radiantTeamId, setRadiantTeamId] = useState("");
    const [direTeamId, setDireTeamId] = useState("");
    const [unknownNames, setUnknownNames] = useState<string[]>([]);

    const handleSignup = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        signup.mutate({
            rolePreference: String(form.get("rolePreference")),
            willingToCaptain: form.has("willingToCaptain"),
        }, {onSuccess: () => signupDialogRef.current?.close()});
    };

    const handleWithdraw = () => {
        withdraw.mutate(undefined, {onSuccess: () => signupDialogRef.current?.close()});
    };

    const openSignupDialog = () => {
        signup.reset();
        withdraw.reset();
        // Back to the saved sign-up, dropping anything typed and then cancelled
        signupFormRef.current?.reset();
        signupDialogRef.current?.showModal();
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

    const openAddMatchDialog = () => {
        createMatch.reset();
        setUnknownNames([]);
        addMatchDialogRef.current?.showModal();
    };

    const handleAddMatch = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        const steamIdByName = new Map(players?.map(player => [player.username.toLowerCase(), player.steamId]));
        const [radiant, dire] = ["radiant", "dire"].map(side => data.getAll(side).map(name => String(name).trim()));
        const unknown = [...radiant, ...dire].filter(name => !steamIdByName.has(name.toLowerCase()));
        setUnknownNames(unknown);
        if (unknown.length) return;

        const steamIds = (names: string[]) => names.map(name => steamIdByName.get(name.toLowerCase())!);
        createMatch.mutate({
            matchId: Number(data.get("matchId")),
            seasonId: season!.id,
            playedTime: String(data.get("playedTime")),
            radiantTeamId,
            direTeamId,
            winner: data.get("winner") as "RADIANT" | "DIRE",
            radiant: steamIds(radiant),
            dire: steamIds(dire),
        }, {
            onSuccess: () => {
                form.reset();
                setRadiantTeamId("");
                setDireTeamId("");
                addMatchDialogRef.current?.close();
            }
        });
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

    const standings = [...season.teams].sort((a, b) => b.wins - a.wins || a.losses - b.losses);
    const captains = signups?.filter(s => s.willingToCaptain).length ?? 0;
    // Same rule as the API, so the button is greyed out instead of failing
    const deletable = !season.teams.length && !matches?.length;

    return (
        <Page
            title={season.name}
            subtitle={
                <>
                    <span className="figures">{formatDateRange(season.startDate, season.endDate)}</span>
                    <span className={`ml-4 font-medium ${statusStyles[season.status].text}`}>{statusStyles[season.status].label}</span>
                    {/* Only admins get the button; the API enforces the same rule */}
                    {user?.admin && (
                        <button aria-label="Delete season" onClick={openDeleteDialog} disabled={!deletable}
                                title={deletable ? "Delete season" : "Seasons with teams or matches can't be deleted"}
                                className="ml-3 rounded-md p-1 align-middle text-danger transition-colors enabled:cursor-pointer enabled:hover:bg-white/5 disabled:cursor-not-allowed disabled:text-ash disabled:opacity-50">
                            {/*Phosphor's Trash*/}
                            <svg aria-hidden="true" width={20} height={20} viewBox="0 0 256 256" fill="currentColor">
                                <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/>
                            </svg>
                        </button>
                    )}
                </>
            }
            aside={
                season.status === "REGISTRATION" ? (
                    user ? (
                        <button className="primary-button" onClick={openSignupDialog}>
                            {mySignup ? "Edit sign-up" : "Join now"}
                        </button>
                    ) : (
                        <button className="primary-button" onClick={signIn}>Sign in with Steam</button>
                    )
                ) : canAddMatch ? (
                    <button className="primary-button" onClick={openAddMatchDialog}>Add match</button>
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
                                    <li key={s.steamId} className="break-inside-avoid">
                                        <Link to={`/players/${s.steamId}`} className="row-link -mx-2 block px-2 py-1.5">
                                            <span className="block truncate">{s.username}</span>
                                            {/*Own line so long preferences like 1 >>>>> 2 wrap instead of being cut off*/}
                                            {(s.rolePreference || s.willingToCaptain) && (
                                                <span className="block text-sm break-words text-ash">
                                                    {[s.rolePreference, s.willingToCaptain && "captain"].filter(Boolean).join(" · ")}
                                                </span>
                                            )}
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

            {user && (
                <dialog ref={signupDialogRef} aria-labelledby="signup-title"
                        className="m-auto w-full max-w-md rounded-lg bg-panel p-6 text-bone backdrop:bg-black/60">
                    <h2 id="signup-title" className="font-display text-3xl font-bold">
                        {mySignup ? "Your sign-up" : `Join ${season.name}`}
                    </h2>
                    <form ref={signupFormRef} onSubmit={handleSignup} className="mt-4 space-y-4">
                        <div>
                            <label htmlFor="role-preference">Your roles, most wanted first</label>
                            {/*Same pattern and length as SeasonSignupRequest on the backend*/}
                            <input
                                id="role-preference"
                                name="rolePreference"
                                required
                                maxLength={32}
                                pattern="\s*[Aa][Nn][Yy]\s*|(?!.*([1-5]).*\1)\s*[1-5](\s*(/|>+)\s*[1-5])*\s*"
                                title='Roles 1 to 5, each once, joined by > or /, e.g. 1 >>> 2 > 3/4, or just "any"'
                                autoComplete="off"
                                spellCheck={false}
                                placeholder="1 >>> 2 > 3/4"
                                defaultValue={mySignup?.rolePreference ?? ""}
                                aria-describedby="role-hint"
                                className="text-input mt-2 block w-full"
                            />
                            <p id="role-hint" className="mt-1.5 text-sm text-ash">
                                1 carry · 2 mid · 3 off · 4 soft · 5 hard<br/>
                                &gt; prefer, / equal, or just &quot;any&quot;
                            </p>
                        </div>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" name="willingToCaptain" defaultChecked={mySignup?.willingToCaptain}
                                   className="accent-accent"/>
                            Willing to captain
                        </label>
                        {(signup.isError || withdraw.isError) &&
                            <p role="alert" className="text-sm text-ash">Couldn't update your sign-up. Refresh and try again.</p>}
                        <div className="flex justify-end gap-3">
                            {mySignup && (
                                <button type="button" className="secondary-button mr-auto text-danger"
                                        onClick={handleWithdraw} disabled={withdraw.isPending}>Withdraw</button>
                            )}
                            <button type="button" className="secondary-button" onClick={() => signupDialogRef.current?.close()}>Cancel</button>
                            <button className="primary-button" disabled={signup.isPending}>{mySignup ? "Save" : "Sign up"}</button>
                        </div>
                    </form>
                </dialog>
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
                                   className="text-input mt-2 block w-full"/>
                        </label>
                        {deleteSeason.isError && <p role="alert" className="text-sm text-ash">Couldn't delete the season. Seasons with teams or matches can't be deleted.</p>}
                        <div className="flex justify-end gap-3">
                            <button type="button" className="secondary-button" onClick={() => deleteDialogRef.current?.close()}>Cancel</button>
                            <button className="primary-button" disabled={confirmText !== "delete" || deleteSeason.isPending}>Delete season</button>
                        </div>
                    </form>
                </dialog>
            )}

            {canAddMatch && (
                <dialog ref={addMatchDialogRef} aria-labelledby="add-match-title"
                        className="m-auto w-full max-w-2xl rounded-lg bg-panel p-6 text-bone backdrop:bg-black/60">
                    <h2 id="add-match-title" className="font-display text-3xl font-bold">Add match</h2>
                    <form onSubmit={handleAddMatch} className="mt-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                                Dota match ID
                                <input name="matchId" required inputMode="numeric" pattern="\d+" title="The number in the game's Stratz or Dotabuff link"
                                       autoComplete="off" className="text-input mt-2 block w-full"/>
                            </label>
                            <label className="block">
                                Played
                                <input name="playedTime" type="datetime-local" required min={`${season.startDate}T00:00`}
                                       className="text-input mt-2 block w-full"/>
                            </label>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                {side: "radiant", label: "Radiant", teamId: radiantTeamId, setTeamId: setRadiantTeamId},
                                {side: "dire", label: "Dire", teamId: direTeamId, setTeamId: setDireTeamId},
                            ].map(({side, label, teamId, setTeamId}) => {
                                const team = season.teams.find(t => t.teamId === teamId);
                                return (
                                    <fieldset key={side}>
                                        <legend>{label}</legend>
                                        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} required
                                                aria-label={`${label} team`} className="text-input mt-2 block w-full">
                                            <option value="">Pick a team…</option>
                                            {season.teams.map(t => <option key={t.teamId} value={t.teamId}>{t.name}</option>)}
                                        </select>
                                        {/*Keyed by team so picking another refills the roster. Typing over a name puts a sub in*/}
                                        {team && (
                                            <div key={team.teamId} className="mt-2 space-y-2">
                                                {team.members.map((member, i) => (
                                                    <input key={member.steamId} name={side} list="match-player-names" required
                                                           defaultValue={member.username} aria-label={`${label} player ${i + 1}`}
                                                           autoComplete="off" spellCheck={false} className="text-input block w-full"/>
                                                ))}
                                            </div>
                                        )}
                                    </fieldset>
                                );
                            })}
                            <datalist id="match-player-names">
                                {players?.map(player => <option key={player.steamId} value={player.username}/>)}
                            </datalist>
                        </div>
                        <fieldset>
                            <legend>Winner</legend>
                            <div className="mt-1 flex gap-4">
                                {(["RADIANT", "DIRE"] as const).map(side => (
                                    <label key={side} className="flex items-center gap-1.5">
                                        <input type="radio" name="winner" value={side} required className="accent-accent"/>
                                        {side === "RADIANT" ? "Radiant" : "Dire"}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <p className="text-sm text-ash">Anyone not on their side's team counts as a sub. Everyone's ELO is worked out again from this game on.</p>
                        {unknownNames.length > 0 && <p role="alert" className="text-sm text-ash">No player called {unknownNames.join(", ")}.</p>}
                        {createMatch.isError && <p role="alert" className="text-sm text-ash">{createMatch.error.message}</p>}
                        <div className="flex justify-end gap-3">
                            <button type="button" className="secondary-button" onClick={() => addMatchDialogRef.current?.close()}>Cancel</button>
                            <button className="primary-button" disabled={createMatch.isPending}>Add match</button>
                        </div>
                    </form>
                </dialog>
            )}
        </Page>
    );
}
