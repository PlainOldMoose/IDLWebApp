import {type SubmitEvent, useRef, useState} from "react";
import {Link} from "react-router";
import {useDraft, useDraftCaptain, useDraftPick, useRenameTeam} from "../services/Queries.ts";
import Panel from "../components/Panel.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";
import {formatElo} from "../util/format.ts";
import type {DraftPlayer, DraftTeam, SteamUser} from "../types.ts";

const TEAM_SIZE = 5;
// Roles get their own column from sm, so each row reads on one line; on phones, and in the pool's four columns from lg,
// they sit under the name. While captains are being made there's a last column for the "Make captain" button ("Captain"
// on phones); picks need none, as the whole row is the button
const poolColumns = (makingCaptains: boolean) => makingCaptains
    ? "grid grid-cols-[minmax(0,1fr)_3.5rem_5rem] items-center gap-x-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_3.5rem_7rem] lg:grid-cols-[minmax(0,1fr)_3rem_7rem]"
    : "grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-x-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_3.5rem] lg:grid-cols-[minmax(0,1fr)_3rem]";

const roles = (player: DraftPlayer) =>
    [player.rolePreference, player.willingToCaptain && "captain"].filter(Boolean).join(" · ");

// The season page while captains pick their teams. From lg it's a draft board: a column per team pinned on top, the pool
// in four columns under it. Below lg the pool comes first, with the picking team in a bar and the teams after
export default function SeasonDraft({seasonId, user}: { seasonId: string, user: SteamUser | null | undefined }) {
    const {data: draft, isPending, isError} = useDraft(seasonId);
    const pick = useDraftPick(seasonId);
    const captain = useDraftCaptain(seasonId);
    const rename = useRenameTeam(seasonId);
    const renameDialogRef = useRef<HTMLDialogElement>(null);
    const [renaming, setRenaming] = useState<DraftTeam | null>(null);
    const pickDialogRef = useRef<HTMLDialogElement>(null);
    // Picks can't be undone, so each one is confirmed first
    const [picking, setPicking] = useState<{ player: DraftPlayer, teamName: string } | null>(null);

    if (isPending) return <Loader label="Loading draft"/>;
    if (isError) return <QueryError message="Couldn't load the draft."/>;

    const onTheClock = draft.teams.find(team => team.teamId === draft.onTheClockTeamId);
    const canPick = !!onTheClock && (!!user?.admin || user?.steamId === onTheClock.captainSteamId);
    const missingCaptains = draft.teamCount - draft.teams.length;
    // Same rule as the API: captains are fixed once the first pick is in
    const canChangeCaptains = !!user?.admin && draft.teams.every(team => team.members.length === 1);
    const columns = poolColumns(canChangeCaptains && missingCaptains > 0);

    const openRenameDialog = (team: DraftTeam) => {
        rename.reset();
        setRenaming(team);
        renameDialogRef.current?.showModal();
    };

    const openPickDialog = (player: DraftPlayer) => {
        pick.reset();
        setPicking({player, teamName: onTheClock!.name});
        pickDialogRef.current?.showModal();
    };

    const handlePick = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        pick.mutate(picking!.player.steamId, {onSuccess: () => pickDialogRef.current?.close()});
    };

    const handleRename = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const name = String(new FormData(e.currentTarget).get("name"));
        rename.mutate({teamId: renaming!.teamId, name}, {onSuccess: () => renameDialogRef.current?.close()});
    };

    return (
        <>
            {/*Picks arrive by polling, so screen readers hear whose turn it is without hunting for the label*/}
            <p className="sr-only" aria-live="polite">{onTheClock ? `${onTheClock.name} is picking now.` : ""}</p>
            {missingCaptains > 0 && (
                <p className="mb-4 px-4 text-ash">
                    {`Needs ${missingCaptains} more captain${missingCaptains === 1 ? "" : "s"} before the draft can start.`}
                </p>
            )}

            {/*Below lg the teams sit under the whole pool, so whose pick it is stays pinned under the navbar instead. The
                shadow fills the gap above it, so rows scrolling past don't show through*/}
            {onTheClock && (
                <aside aria-label="Picking now"
                       className="sticky top-[calc(var(--nav-height)+0.5rem)] z-20 shadow-[0_-0.5rem_0_var(--color-night)] mb-4 flex items-center justify-between gap-3 rounded-lg bg-panel-raised px-4 py-2.5 ring-1 ring-accent/70 ring-inset lg:hidden">
                    <div className="min-w-0">
                        <p className="truncate font-display text-lg font-bold">{onTheClock.name}</p>
                        <p className="figures text-sm text-ash">
                            <span className="font-medium text-accent">Picking now</span>
                            {" · "}<span>{`${onTheClock.members.length}/${TEAM_SIZE}`}</span>
                            {" · "}Total <span className="font-medium text-bone">{onTheClock.draftScore}</span>
                        </p>
                    </div>
                    <a href="#teams" className="secondary-button shrink-0 px-3 py-1.5 text-sm">View teams</a>
                </aside>
            )}

            {/*Pool first in the markup, so on phones it comes before the teams; from lg the board moves above it*/}
            <div className="grid gap-4">
                <Panel title="Pool" meta={`${draft.pool.length} left`} padded={false} className="min-w-0">
                    {captain.error && <p role="alert" className="px-3 pt-2 text-sm text-ash">{captain.error.message}</p>}
                    {draft.pool.length ? (<>
                        {/*From lg the pool flows down four columns so it all fits on screen, each with its own headings*/}
                        <div aria-hidden="true" className="lg:grid lg:grid-cols-4 lg:gap-x-4">
                            {[0, 1, 2, 3].map(column => (
                                <div key={column} className={`${columns} ${column ? "hidden lg:grid" : ""} px-3 pt-1.5 pb-2 text-sm text-ash`}>
                                    <p>Player</p>
                                    <p className="hidden sm:block lg:hidden">Roles</p>
                                    <p className="text-right">Score</p>
                                </div>
                            ))}
                        </div>
                        <ul className="lg:columns-4 lg:gap-x-4">
                            {draft.pool.map(player => {
                                // A link can't sit inside a button, so the name only links to the profile when the row isn't one
                                const cells = <>
                                    <span className="min-w-0">
                                        {canPick
                                            ? <span className="block truncate">{player.username}</span>
                                            : <Link to={`/players/${player.steamId}`} className="block truncate hover:underline">{player.username}</Link>}
                                        <span className="block text-sm wrap-break-word text-ash sm:hidden lg:block">{roles(player)}</span>
                                    </span>
                                    <span className="hidden text-sm wrap-break-word text-ash sm:block lg:hidden">{roles(player)}</span>
                                    <span className="figures text-right">{player.draftScore}</span>
                                </>;
                                return canPick ? (
                                    // The whole card picks; the dialog that follows confirms it
                                    <li key={player.steamId} className="break-inside-avoid pb-1.5">
                                        <button type="button" aria-label={`Pick ${player.username}`} disabled={pick.isPending}
                                                onClick={() => openPickDialog(player)}
                                                className={`${columns} w-full cursor-pointer touch-manipulation gap-y-1.5 rounded-md border border-rule px-3 py-2 text-left transition-colors disabled:opacity-40 lg:py-1.5 [@media(hover:hover)]:hover:border-ash [@media(hover:hover)]:hover:bg-panel-raised`}>
                                            {cells}
                                        </button>
                                    </li>
                                ) : (
                                    <li key={player.steamId} className={`${columns} break-inside-avoid gap-y-1.5 rounded-md px-3 py-2 lg:py-1.5`}>
                                        {cells}
                                        {canChangeCaptains && missingCaptains > 0 && (
                                            <span className="flex justify-end">
                                                <button type="button" className="secondary-button touch-manipulation px-3 py-1.5 text-sm"
                                                        aria-label={`Make ${player.username} captain`} disabled={captain.isPending}
                                                        onClick={() => captain.mutate({steamId: player.steamId, captain: true})}>
                                                    <span className="sm:hidden">Captain</span>
                                                    <span className="hidden sm:inline">Make captain</span>
                                                </button>
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </>) : (
                        <p className="p-3 text-ash">Draft complete. An admin starts the season once the team names are in.</p>
                    )}
                </Panel>

                {/*Phones jump here from the bar's "View teams"; scroll-mt keeps the heading clear of the bar. From lg it's the
                    board, above the pool and pinned under the navbar like the bar: the first shadow fills the gap above it so
                    cards scrolling past don't show through, the second lifts it off the cards passing beneath*/}
                <Panel id="teams" title="Teams" padded={false}
                       className="scroll-mt-20 lg:sticky lg:top-[calc(var(--nav-height)+0.5rem)] lg:z-20 lg:order-first lg:shadow-[0_-0.5rem_0_var(--color-night),0_0.75rem_1.5rem_-0.5rem_var(--color-night)]">
                    {/*A column per team; a league too big for one row wraps onto a second*/}
                    <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(7rem,1fr))]">
                        {draft.teams.map(team => {
                            const isOnTheClock = team.teamId === draft.onTheClockTeamId;
                            const canRename = !!user?.admin || user?.steamId === team.captainSteamId;
                            return (
                                <section key={team.teamId}
                                         className={`rounded-md px-3 py-2.5 ${isOnTheClock ? "bg-panel-raised ring-1 ring-accent/70" : ""}`}>
                                    {/*Board columns are narrow, so there the name gets the full width and wraps to two lines instead of cutting off,
                                        with the pencil sharing the count's cell, beside the short "Total" line. Every column keeps both lines so the rosters stay level*/}
                                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2">
                                        <h3 title={team.name} className="min-w-0 truncate font-display text-xl font-bold lg:col-span-2 lg:line-clamp-2 lg:min-h-[2lh] lg:text-lg lg:whitespace-normal lg:wrap-break-word">{team.name}</h3>
                                        {canRename && (
                                            <button type="button" aria-label="Rename team" title="Rename team"
                                                    onClick={() => openRenameDialog(team)}
                                                    className="col-start-2 row-start-1 shrink-0 cursor-pointer justify-self-end rounded-md p-2 text-ash lg:relative lg:z-10 lg:row-start-2 lg:self-end lg:p-1 transition-colors hover:bg-white/5 hover:text-bone">
                                                {/*Phosphor's PencilSimple*/}
                                                <svg aria-hidden="true" width={18} height={18} viewBox="0 0 256 256" fill="currentColor">
                                                    <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/>
                                                </svg>
                                            </button>
                                        )}
                                        <p className="col-span-2 flex justify-between gap-x-3 text-sm text-ash lg:col-start-1 lg:row-start-2 lg:flex-col">
                                        {isOnTheClock
                                            ? <span className="font-medium text-accent">Picking now</span>
                                            : <span className="figures">{`${team.members.length}/${TEAM_SIZE}`}</span>}
                                        <span className="figures">Total <span className="font-medium text-bone">{team.draftScore}</span></span>
                                        </p>
                                    </div>
                                    <ul className="mt-1.5 text-sm">
                                        {team.members.map(member => (
                                            <li key={member.steamId} className="flex justify-between gap-3 py-0.5">
                                                <span className="flex min-w-0 items-center">
                                                    {/*Captains are bold; the board has no room for the word, so there it's for screen readers only*/}
                                                    <span className={`truncate ${member.steamId === team.captainSteamId ? "font-semibold" : ""}`}>{member.username}</span>
                                                    {member.steamId === team.captainSteamId && (
                                                        <span className="ml-2 shrink-0 text-ash lg:sr-only">captain</span>
                                                    )}
                                                    {member.steamId === team.captainSteamId && canChangeCaptains && (
                                                        <button type="button" aria-label={`Remove ${member.username} as captain`} title="Remove captain"
                                                                disabled={captain.isPending}
                                                                onClick={() => captain.mutate({steamId: team.captainSteamId, captain: false})}
                                                                className="ml-1 shrink-0 cursor-pointer rounded-md p-1.5 text-danger transition-colors hover:bg-white/5 disabled:opacity-40">
                                                            {/*Phosphor's X*/}
                                                            <svg aria-hidden="true" width={14} height={14} viewBox="0 0 256 256" fill="currentColor">
                                                                <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
                                                            </svg>
                                                        </button>
                                                    )}
                                                </span>
                                                {/*No room in a board column, where the team's total is the number that matters*/}
                                                <span className="figures text-ash lg:hidden">{formatElo(member.elo)}</span>
                                            </li>
                                        ))}
                                        {/*The board shows the picks still to come as faint rows, the same height as a player's*/}
                                        {Array.from({length: TEAM_SIZE - team.members.length}, (_, i) => (
                                            <li key={i} aria-hidden="true" className="hidden py-0.5 text-ash/40 lg:block">—</li>
                                        ))}
                                    </ul>
                                </section>
                            );
                        })}
                    </div>
                </Panel>
            </div>

            <dialog ref={pickDialogRef} aria-labelledby="pick-title" className="dialog">
                <h2 id="pick-title" className="font-display text-3xl font-bold">Confirm pick</h2>
                <form onSubmit={handlePick} className="mt-4 space-y-4">
                    <p>{`${picking?.player.username} joins ${picking?.teamName}. Picks can't be undone.`}</p>
                    {pick.isError && <p role="alert" className="text-sm text-ash">{pick.error.message}</p>}
                    <div className="flex justify-end gap-3">
                        <button type="button" className="secondary-button" onClick={() => pickDialogRef.current?.close()}>Cancel</button>
                        {/*The dialog opens on Cancel, so a stray Enter backs out of a pick that can't be undone*/}
                        <button type="submit" className="primary-button" disabled={pick.isPending}>
                            {`Pick ${picking?.player.username}`}
                        </button>
                    </div>
                </form>
            </dialog>

            <dialog ref={renameDialogRef} aria-labelledby="rename-team-title" className="dialog">
                <h2 id="rename-team-title" className="font-display text-3xl font-bold">Rename team</h2>
                {/*Keyed by team so the field starts from that team's current name*/}
                <form key={renaming?.teamId} onSubmit={handleRename} className="mt-4 space-y-4">
                    <label className="block">
                        Team name
                        <input name="name" required maxLength={32} defaultValue={renaming?.name} autoComplete="off"
                               className="text-input mt-2 block w-full"/>
                    </label>
                    {rename.isError && <p role="alert" className="text-sm text-ash">{rename.error.message}</p>}
                    <div className="flex justify-end gap-3">
                        <button type="button" className="secondary-button" onClick={() => renameDialogRef.current?.close()}>Cancel</button>
                        <button type="submit" className="primary-button" disabled={rename.isPending}>Save</button>
                    </div>
                </form>
            </dialog>
        </>
    );
}
