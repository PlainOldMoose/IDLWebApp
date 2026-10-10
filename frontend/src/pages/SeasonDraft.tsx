import {type SubmitEvent, useRef, useState} from "react";
import {Link} from "react-router";
import {useDraft, useDraftCaptain, useDraftPick, useRenameTeam} from "../services/Queries.ts";
import Panel from "../components/Panel.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";
import {formatElo} from "../util/format.ts";
import type {DraftPlayer, DraftTeam, SteamUser} from "../types.ts";

const TEAM_SIZE = 5;
// Roles get their own column from sm up, so each row reads on one line; on phones they sit under the name. The last
// column is as wide as the button the rows have: "Make captain" until every team has one, "Pick" after
const poolColumns = (makingCaptains: boolean) => makingCaptains
    ? "grid grid-cols-[minmax(0,1fr)_3.5rem_7rem] items-center gap-x-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_3.5rem_7rem]"
    : "grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem] items-center gap-x-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_3.5rem_3.5rem]";

const roles = (player: DraftPlayer) =>
    [player.rolePreference, player.willingToCaptain && "captain"].filter(Boolean).join(" · ");

// The season page while captains pick their teams: team cards on top, the pool below
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
            <p className="sr-only" aria-live="polite">{onTheClock ? `${onTheClock.name} is on the clock.` : ""}</p>
            {missingCaptains > 0 && (
                <p className="mb-4 px-4 text-ash">
                    {`Needs ${missingCaptains} more captain${missingCaptains === 1 ? "" : "s"} before the draft can start.`}
                </p>
            )}

            {/*Pool first, so on phones it comes before the teams*/}
            {/*Teams take two columns from xl, so a full league of captains fits on screen beside the pool*/}
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_34rem]">
                <Panel title="Pool" meta={`${draft.pool.length} left`} padded={false} className="min-w-0">
                    {captain.error && <p role="alert" className="px-3 pt-2 text-sm text-ash">{captain.error.message}</p>}
                    {draft.pool.length ? (<>
                        <div aria-hidden="true" className={`${columns} px-3 pt-1.5 pb-2 text-sm text-ash`}>
                            <p>Player</p>
                            <p className="hidden sm:block">Roles</p>
                            <p className="text-right">Score</p>
                        </div>
                        <ul>
                            {draft.pool.map(player => (
                                <li key={player.steamId} className={`${columns} gap-y-1.5 rounded-md px-3 py-2 transition-colors hover:bg-panel-raised`}>
                                    <span className="min-w-0">
                                        <Link to={`/players/${player.steamId}`} className="block truncate hover:underline">{player.username}</Link>
                                        <span className="block text-sm wrap-break-word text-ash sm:hidden">{roles(player)}</span>
                                    </span>
                                    <span className="hidden text-sm wrap-break-word text-ash sm:block">{roles(player)}</span>
                                    <span className="figures text-right">{player.draftScore}</span>
                                    <span className="flex justify-end gap-2">
                                        {canPick && (
                                            <button type="button" className="primary-button px-3 py-1 text-sm"
                                                    aria-label={`Pick ${player.username}`} disabled={pick.isPending}
                                                    onClick={() => openPickDialog(player)}>Pick</button>
                                        )}
                                        {canChangeCaptains && missingCaptains > 0 && (
                                            <button type="button" className="secondary-button px-3 py-1 text-sm"
                                                    aria-label={`Make ${player.username} captain`} disabled={captain.isPending}
                                                    onClick={() => captain.mutate({steamId: player.steamId, captain: true})}>
                                                Make captain
                                            </button>
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </>) : (
                        <p className="p-3 text-ash">Draft complete. An admin starts the season once the team names are in.</p>
                    )}
                </Panel>

                {/*Sticks under the navbar and scrolls on its own, so every team stays in view while picking from a long pool*/}
                <Panel title="Teams" padded={false}
                       className="lg:sticky lg:top-16 lg:flex lg:max-h-[calc(100dvh-5rem)] lg:flex-col [&>div]:min-h-0 [&>div]:overflow-y-auto">
                    <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        {draft.teams.map(team => {
                            const isOnTheClock = team.teamId === draft.onTheClockTeamId;
                            const canRename = !!user?.admin || user?.steamId === team.captainSteamId;
                            return (
                                <section key={team.teamId}
                                         className={`rounded-md px-3 py-2.5 ${isOnTheClock ? "bg-panel-raised ring-1 ring-accent/70" : ""}`}>
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 title={team.name} className="min-w-0 truncate font-display text-xl font-bold">{team.name}</h3>
                                        {canRename && (
                                            <button type="button" aria-label="Rename team" title="Rename team"
                                                    onClick={() => openRenameDialog(team)}
                                                    className="shrink-0 cursor-pointer rounded-md p-1 text-ash transition-colors hover:bg-white/5 hover:text-bone">
                                                {/*Phosphor's PencilSimple*/}
                                                <svg aria-hidden="true" width={18} height={18} viewBox="0 0 256 256" fill="currentColor">
                                                    <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/>
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    <p className="flex justify-between gap-3 text-sm text-ash">
                                        {isOnTheClock
                                            ? <span className="font-medium text-accent">On the clock</span>
                                            : <span className="figures">{`${team.members.length} of ${TEAM_SIZE}`}</span>}
                                        <span className="figures">Total <span className="font-medium text-bone">{team.draftScore}</span></span>
                                    </p>
                                    <ul className="mt-1.5 text-sm">
                                        {team.members.map(member => (
                                            <li key={member.steamId} className="flex justify-between gap-3 py-0.5">
                                                <span className="flex min-w-0 items-center">
                                                    <span className="truncate">{member.username}</span>
                                                    {member.steamId === team.captainSteamId && <span className="ml-2 text-ash">captain</span>}
                                                    {member.steamId === team.captainSteamId && canChangeCaptains && (
                                                        <button type="button" aria-label={`Remove ${member.username} as captain`} title="Remove captain"
                                                                disabled={captain.isPending}
                                                                onClick={() => captain.mutate({steamId: team.captainSteamId, captain: false})}
                                                                className="ml-1 shrink-0 cursor-pointer rounded-md p-0.5 text-danger transition-colors hover:bg-white/5 disabled:opacity-40">
                                                            {/*Phosphor's X*/}
                                                            <svg aria-hidden="true" width={14} height={14} viewBox="0 0 256 256" fill="currentColor">
                                                                <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
                                                            </svg>
                                                        </button>
                                                    )}
                                                </span>
                                                <span className="figures text-ash">{formatElo(member.elo)}</span>
                                            </li>
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
