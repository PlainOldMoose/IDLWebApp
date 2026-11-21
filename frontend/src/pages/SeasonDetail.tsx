import {type KeyboardEvent, type SubmitEvent, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router";
import {
    useCompleteSeason,
    useCreateForfeit,
    useCreateMatch,
    useCurrentUser,
    useDeleteSeason,
    useLeagueSync,
    useMatchBin,
    useMatches,
    usePlayers,
    useRejectPendingMatch,
    useRestoreMatch,
    useSeasonDetail,
    useSeasonSignup,
    useSetLeague,
    useDraft,
    useSeasonSignups,
    useStartDraft,
    useStartSeason,
    useSyncLeague,
    useWithdrawSignup
} from "../services/Queries.ts";
import MatchSummaryCard, {matchColumns} from "../components/MatchSummaryCard.tsx";
import Page from "../components/Page.tsx";
import Panel from "../components/Panel.tsx";
import StatStrip from "../components/StatStrip.tsx";
import Loader from "../components/Loader.tsx";
import QueryError from "../components/QueryError.tsx";
import WarningIcon from "../components/WarningIcon.tsx";
import FormDialog from "../components/FormDialog.tsx";
import SeasonDraft from "./SeasonDraft.tsx";
import {statusStyles} from "../util/statusStyles.ts";
import {hasDefaultName, TEAM_SIZE} from "../util/draft.ts";
import {formatDate, formatDateRange, formatElo, formatRelative, isLegacySeason, sideName} from "../util/format.ts";
import type {PendingMatch, PlayerSummary, SeasonSignup} from "../types.ts";

const RECENT_MATCH_COUNT = 10;

// Who each Add match box's player stood in for: the team member the box started with, when someone off the team was
// typed over them and they aren't playing from another box. Names match case-insensitively, as the lookup does
const replacedMembers = (names: string[], members: PlayerSummary[]) => {
    const typed = names.map(name => name.trim().toLowerCase());
    const memberNames = members.map(member => member.username.toLowerCase());
    return members.map((member, i) => typed[i] && !memberNames.includes(typed[i]) && !typed.includes(member.username.toLowerCase())
        ? member : null);
};

// A queued game's players in a team's Add match boxes: members who played in their own box, then the side's other
// players in the boxes of members who didn't, so they show as subbing. Blank where the sync couldn't name anyone
const slotted = (members: PlayerSummary[], played: PendingMatch["radiant"]) => {
    const others = played.filter(p => !members.some(m => m.steamId === p.steamId)).map(p => p.username ?? "");
    return members.map(m => played.some(p => p.steamId === m.steamId) ? m.username : others.shift() ?? "");
};

const menuItem = "block w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-panel";

export default function SeasonDetail() {
    const {seasonId} = useParams<{ seasonId: string }>();
    const {data: season, isPending, isError} = useSeasonDetail(seasonId);
    // Matches only matter once the season starts. Sign-ups are kept for the subs list
    const started = season?.status === "ACTIVE" || season?.status === "COMPLETED";
    const {data: signups} = useSeasonSignups(seasonId);
    const {data: user} = useCurrentUser();
    const {data: matches} = useMatches(seasonId, !!seasonId && started);
    const signup = useSeasonSignup(seasonId);
    const withdraw = useWithdrawSignup(seasonId);
    const mySignup = signups?.find(s => s.steamId === user?.steamId);
    const signupDialogRef = useRef<HTMLDialogElement>(null);
    const signupFormRef = useRef<HTMLFormElement>(null);
    const [asSub, setAsSub] = useState(false);
    const deleteSeason = useDeleteSeason(seasonId);
    const deleteDialogRef = useRef<HTMLDialogElement>(null);
    const navigate = useNavigate();
    const canAddMatch = !!user?.admin && season?.status === "ACTIVE";
    const createMatch = useCreateMatch();
    const createForfeit = useCreateForfeit();
    const forfeitDialogRef = useRef<HTMLDialogElement>(null);
    const forfeitFormRef = useRef<HTMLFormElement>(null);
    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const addButtonRef = useRef<HTMLButtonElement>(null);
    const {data: players} = usePlayers(canAddMatch);
    const addMatchDialogRef = useRef<HTMLDialogElement>(null);
    const [radiantTeamId, setRadiantTeamId] = useState("");
    const [direTeamId, setDireTeamId] = useState("");
    const [unknownNames, setUnknownNames] = useState<string[]>([]);
    // What's typed in each side's player boxes, for the "Subbing for" hints. A side is absent until a box is edited
    const [boxNames, setBoxNames] = useState<Record<string, string[] | undefined>>({});
    // The queued game being reviewed, which fills in the Add match form; null for a game typed in from scratch
    const [prefill, setPrefill] = useState<PendingMatch | null>(null);
    const canSync = canAddMatch && !!season?.leagueId;
    const {data: league, isPending: leaguePending, isError: leagueError} = useLeagueSync(seasonId, canSync);
    const syncLeague = useSyncLeague(seasonId);
    const rejectPending = useRejectPendingMatch(seasonId);
    const setLeague = useSetLeague(seasonId);
    const leagueDialogRef = useRef<HTMLDialogElement>(null);
    const {data: bin} = useMatchBin(seasonId, canAddMatch);
    const restoreMatch = useRestoreMatch();
    const completeSeason = useCompleteSeason(seasonId);
    const endDialogRef = useRef<HTMLDialogElement>(null);
    const [winnerTeamId, setWinnerTeamId] = useState("");
    const startDraft = useStartDraft(seasonId);
    const draftDialogRef = useRef<HTMLDialogElement>(null);
    // Shares the draft section's query, so this adds no requests
    const {data: draft} = useDraft(seasonId, season?.status === "DRAFTING");
    // Same rule as the API: the pool only empties once every team has a captain and 5 players
    const draftComplete = !!draft && !draft.pool.length;
    // Starting doesn't wait for these, so one absent captain can't hold up the league; the dialog just says so
    const defaultNamed = draft?.teams.filter(hasDefaultName).length ?? 0;
    const startSeason = useStartSeason(seasonId);
    const startSeasonDialogRef = useRef<HTMLDialogElement>(null);

    const handleSignup = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        signup.mutate({
            rolePreference: asSub ? null : String(form.get("rolePreference")),
            willingToCaptain: form.has("willingToCaptain"),
            sub: asSub,
        }, {onSuccess: () => signupDialogRef.current?.close()});
    };

    const handleWithdraw = () => {
        withdraw.mutate(undefined, {onSuccess: () => signupDialogRef.current?.close()});
    };

    const openSignupDialog = () => {
        // Back to the saved sign-up, dropping anything typed and then cancelled
        signupFormRef.current?.reset();
        setAsSub(!!mySignup?.sub);
        signupDialogRef.current?.showModal();
    };

    const handleDelete = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        deleteSeason.mutate(undefined, {onSuccess: () => navigate("/seasons")});
    };

    const openAddMatchDialog = (pending?: PendingMatch) => {
        setUnknownNames([]);
        setPrefill(pending ?? null);
        if (pending) {
            const team = (teamId: string | null) => season!.teams.find(t => t.teamId === teamId);
            const radiantTeam = team(pending.radiantTeamId);
            const direTeam = team(pending.direTeamId);
            setRadiantTeamId(radiantTeam?.teamId ?? "");
            setDireTeamId(direTeam?.teamId ?? "");
            setBoxNames({
                radiant: radiantTeam && slotted(radiantTeam.members, pending.radiant),
                dire: direTeam && slotted(direTeam.members, pending.dire),
            });
        } else {
            setBoxNames({});
        }
        addMatchDialogRef.current?.showModal();
    };

    const openForfeitDialog = () => {
        forfeitFormRef.current?.reset();
        forfeitDialogRef.current?.showModal();
    };

    const handleForfeit = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        createForfeit.mutate({
            seasonId: season!.id,
            playedTime: String(data.get("playedTime")),
            forfeitingTeamId: String(data.get("forfeitingTeamId")),
            opponentTeamId: String(data.get("opponentTeamId")),
        }, {onSuccess: () => forfeitDialogRef.current?.close()});
    };

    // A menu's keys: arrows move between its entries, Escape closes it and goes back to the Add button
    const handleAddMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape" && addMenuOpen) {
            setAddMenuOpen(false);
            addButtonRef.current?.focus();
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!addMenuOpen) setAddMenuOpen(true);
            const items = [...e.currentTarget.querySelectorAll<HTMLElement>("[role=menuitem]")];
            const at = items.indexOf(document.activeElement as HTMLElement);
            items.at(e.key === "ArrowDown" ? (at + 1) % items.length : at - 1)?.focus();
        }
    };

    const handleSetLeague = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const leagueId = String(new FormData(e.currentTarget).get("leagueId")).trim();
        setLeague.mutate(leagueId ? Number(leagueId) : null, {onSuccess: () => leagueDialogRef.current?.close()});
    };

    const handleAddMatch = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        const steamIdByName = new Map(players?.map(player => [player.username.toLowerCase(), player.steamId]));
        const [radiant, dire] = ["radiant", "dire"].map(side => data.getAll(side).map(name => String(name).trim()));
        const unknown = [...radiant, ...dire].filter(name => !steamIdByName.has(name.toLowerCase()));
        setUnknownNames(unknown);
        if (unknown.length) return;

        const steamIds = (names: string[]) => names.map(name => steamIdByName.get(name.toLowerCase())!);
        const subbingFor: Record<string, string> = {};
        for (const [names, teamId] of [[radiant, radiantTeamId], [dire, direTeamId]] as const) {
            replacedMembers(names, season!.teams.find(team => team.teamId === teamId)!.members).forEach((member, i) => {
                if (member) subbingFor[steamIdByName.get(names[i].toLowerCase())!] = member.steamId;
            });
        }
        createMatch.mutate({
            matchId: Number(data.get("matchId")),
            seasonId: season!.id,
            playedTime: String(data.get("playedTime")),
            radiantTeamId,
            direTeamId,
            winner: data.get("winner") as "RADIANT" | "DIRE",
            radiant: steamIds(radiant),
            dire: steamIds(dire),
            subbingFor,
        }, {
            onSuccess: () => {
                form.reset();
                setRadiantTeamId("");
                setDireTeamId("");
                addMatchDialogRef.current?.close();
            }
        });
    };

    const openEndDialog = () => {
        setWinnerTeamId("");
        endDialogRef.current?.showModal();
    };

    const handleEnd = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        completeSeason.mutate(winnerTeamId, {onSuccess: () => endDialogRef.current?.close()});
    };

    const handleStartDraft = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        startDraft.mutate(undefined, {onSuccess: () => draftDialogRef.current?.close()});
    };

    const handleStartSeason = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        startSeason.mutate(undefined, {onSuccess: () => startSeasonDialogRef.current?.close()});
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

    const signedUp = signups?.filter(s => !s.sub) ?? [];
    // Includes players past a multiple of 5 once sign-ups close; the API works that out
    const subs = signups?.filter(s => s.sub) ?? [];
    const captains = signedUp.filter(s => s.willingToCaptain).length;
    // Same rule as the API, so the button is greyed out instead of failing
    const deletable = !season.teams.length && !matches?.length;
    const teamOptions = <>
        <option value="">Pick a team…</option>
        {season.teams.map(t => <option key={t.teamId} value={t.teamId}>{t.name}</option>)}
    </>;

    const signupList = (list: SeasonSignup[]) => (
        <ul className="columns-2 gap-x-4 sm:columns-3">
            {list.map((s) => (
                <li key={s.steamId} className="break-inside-avoid">
                    <Link to={`/players/${s.steamId}`} className="row-link -mx-2 block px-2 py-1.5">
                        <span className="block truncate">{s.username}</span>
                        {/*Own line so long preferences like 1 >>>>> 2 wrap instead of being cut off*/}
                        {(s.rolePreference || s.willingToCaptain) && (
                            <span className="block text-sm wrap-break-word text-ash">
                                {[s.rolePreference, s.willingToCaptain && "captain"].filter(Boolean).join(" · ")}
                            </span>
                        )}
                    </Link>
                </li>
            ))}
        </ul>
    );

    return (
        <Page
            title={season.name}
            subtitle={
                <>
                    <span className="figures">{formatDateRange(season.startDate, season.endDate)}</span>
                    <span className={`ml-4 font-medium ${statusStyles[season.status].text}`}>
                        {draftComplete ? "Draft complete" : statusStyles[season.status].label}
                    </span>
                    {user?.admin && (
                        <button aria-label="Delete season" onClick={() => deleteDialogRef.current?.showModal()} disabled={!deletable}
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
                        <div className="flex gap-3">
                            {user.admin && <button className="secondary-button" onClick={() => draftDialogRef.current?.showModal()}>Start draft</button>}
                            <button className="primary-button" onClick={openSignupDialog}>
                                {mySignup ? "Edit sign-up" : "Join now"}
                            </button>
                        </div>
                    ) : (
                        <a className="primary-button" href={`/auth/login?returnTo=${encodeURIComponent(globalThis.location.pathname)}`}>Sign in with Steam</a>
                    )
                ) : season.status === "DRAFTING" ? (
                    user?.admin && (
                        <button className="primary-button" onClick={() => startSeasonDialogRef.current?.showModal()} disabled={!draftComplete}
                                title={draftComplete ? undefined : "Every team needs 5 players first"}>
                            Start season
                        </button>
                    )
                ) : canAddMatch ? (
                    <div className="flex flex-wrap justify-end gap-3">
                        <button className="secondary-button" onClick={openEndDialog}>End season</button>
                        <button className="secondary-button" onClick={() => leagueDialogRef.current?.showModal()}>League ticket</button>
                        {canSync && (
                            <button className="secondary-button" onClick={() => syncLeague.mutate()} disabled={syncLeague.isPending}>
                                {syncLeague.isPending ? "Syncing…" : "Sync now"}
                            </button>
                        )}
                        {/*Closes when focus leaves it, so a click elsewhere or tabbing away dismisses it*/}
                        <div className="relative" onKeyDown={handleAddMenuKey}
                             onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setAddMenuOpen(false)}>
                            <button ref={addButtonRef} className="primary-button inline-flex items-center gap-2" aria-haspopup="menu" aria-expanded={addMenuOpen}
                                    onClick={() => setAddMenuOpen(!addMenuOpen)}>
                                Add
                                {/*Phosphor's CaretDown*/}
                                <svg aria-hidden="true" width={14} height={14} viewBox="0 0 256 256" fill="currentColor">
                                    <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>
                                </svg>
                            </button>
                            {addMenuOpen && (
                                <div role="menu" className="absolute right-0 z-10 mt-2 min-w-36 rounded-md border border-rule bg-panel-raised p-1 shadow-lg">
                                    <button role="menuitem" className={menuItem} onClick={() => {
                                        setAddMenuOpen(false);
                                        openAddMatchDialog();
                                    }}>Match</button>
                                    <button role="menuitem" className={menuItem} onClick={() => {
                                        setAddMenuOpen(false);
                                        openForfeitDialog();
                                    }}>Forfeit</button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : season.winnerTeamName && (
                    <div className="border-l-3 border-aegis pl-4">
                        <p className="text-sm text-ash">Champions</p>
                        <p className="font-display text-3xl font-bold text-aegis">{season.winnerTeamName}</p>
                    </div>
                )
            }
        >
            {isLegacySeason(season.name) && (
                <section aria-labelledby="legacy-season-title" className="mb-4 flex gap-3 rounded-lg border border-warning bg-warning/10 p-4">
                    <WarningIcon size={22} className="mt-0.5 shrink-0 text-warning"/>
                    <div>
                        <h2 id="legacy-season-title" className="font-semibold text-warning">Legacy season</h2>
                        <p className="mt-1 text-bone/80">
                            This season comes from the old league records. Some players are no longer tracked, so teams, results
                            and ELO may look off.
                        </p>
                    </div>
                </section>
            )}
            {season.status === "REGISTRATION" && (
                <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <div className="space-y-4">
                        <Panel title="Signed up" meta={`${signedUp.length} players`}>
                            {signedUp.length ? signupList(signedUp) : <p className="text-ash">Nobody has signed up yet.</p>}
                        </Panel>
                        <Panel title="Subs">
                            {subs.length ? signupList(subs) : <p className="text-ash">Nobody has signed up as a sub yet.</p>}
                        </Panel>
                    </div>
                    <Panel title="Sign-ups">
                        <StatStrip stats={[
                            {label: "Players", value: signedUp.length},
                            {label: "Subs", value: subs.length},
                            {label: "Captains", value: captains},
                        ]}/>
                        <p className="mt-4 border-t border-rule pt-3 text-sm text-ash">
                            The season starts on {formatDate(season.startDate)}.
                        </p>
                    </Panel>
                </div>
            )}

            {season.status === "DRAFTING" && <SeasonDraft seasonId={season.id} user={user}/>}

            {canSync && (
                <Panel title="Matches to check" className="mb-4" meta={league?.pending.length ? `${league.pending.length} waiting` : undefined}>
                    {leaguePending ? <Loader label="Loading the league sync"/>
                        : leagueError ? <QueryError message="Couldn't load the league sync."/>
                        : (
                            <>
                                {league.pending.length ? (
                                    <ul className="divide-y divide-rule">
                                        {league.pending.map(match => (
                                            <li key={match.matchId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5 first:pt-0">
                                                <div className="min-w-0">
                                                    <p>
                                                        <span id={`pending-${match.matchId}`} className="figures">{match.matchId}</span>
                                                        <span className="figures ml-3 text-sm text-ash">{formatDate(match.playedTime)}</span>
                                                    </p>
                                                    <p className="text-sm text-ash">
                                                        <span>{match.reason}</span>
                                                        {" · "}
                                                        <a href={`https://www.opendota.com/matches/${match.matchId}`} target="_blank" rel="noreferrer"
                                                           className="text-accent underline-offset-2 hover:underline">View on OpenDota</a>
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="secondary-button" onClick={() => openAddMatchDialog(match)}
                                                            aria-describedby={`pending-${match.matchId}`}>Review</button>
                                                    <button className="secondary-button" onClick={() => rejectPending.mutate(match.matchId)}
                                                            aria-describedby={`pending-${match.matchId}`} disabled={rejectPending.isPending}>Reject</button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-ash">Nothing to check. Ticketed games that can't be added on their own show up here.</p>
                                )}
                                {rejectPending.isError && <p role="alert" className="mt-2 text-sm text-ash">{rejectPending.error.message}</p>}
                                {/*Announced, so "Sync now" says how it went*/}
                                <div aria-live="polite" className="mt-4 border-t border-rule pt-3 text-sm text-ash">
                                    {league.error ? (
                                        <p className="flex items-center gap-2">
                                            <WarningIcon size={18} className="shrink-0 text-warning"/>
                                            <span>{`Last sync failed: ${league.error}`}</span>
                                        </p>
                                    ) : (
                                        <p>{league.syncedAt ? `Last synced ${formatRelative(league.syncedAt)}` : "Not synced yet. Games are checked every 30 minutes."}</p>
                                    )}
                                </div>
                            </>
                        )}
                </Panel>
            )}

            {/*Only when there's something in it: deletes are rare*/}
            {canAddMatch && !!bin?.length && (
                <Panel title="Recently deleted" className="mb-4">
                    <ul className="divide-y divide-rule">
                        {bin.map(match => (
                            <li key={match.matchId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5 first:pt-0">
                                <div className="min-w-0">
                                    {/*A forfeit's ID is made up, so it's named instead. Radiant is the team that forfeited*/}
                                    <p id={`binned-${match.matchId}`} className="figures">{match.forfeit ? "Forfeit" : match.matchId}</p>
                                    <p className="truncate text-sm">{match.forfeit
                                        ? `${match.radiantTeamName} forfeited to ${match.direTeamName}`
                                        : `${match.radiantTeamName ?? sideName.RADIANT} vs ${match.direTeamName ?? sideName.DIRE} · ${sideName[match.winner]} won`}</p>
                                    <p className="text-sm text-ash">{`Deleted ${formatRelative(match.deletedAt)} · goes ${formatRelative(match.purgeAt)}`}</p>
                                </div>
                                <button className="secondary-button" onClick={() => restoreMatch.mutate(match.matchId)}
                                        aria-describedby={`binned-${match.matchId}`} disabled={restoreMatch.isPending}>
                                    {restoreMatch.isPending && restoreMatch.variables === match.matchId ? "Restoring…" : "Restore"}
                                </button>
                            </li>
                        ))}
                    </ul>
                    {restoreMatch.isError && <p role="alert" className="mt-2 text-sm text-ash">{restoreMatch.error.message}</p>}
                </Panel>
            )}

            {started && (
                <>
                    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                        {/*Latest few, with the rest on the season-filtered Matches page; the button is trimmed to keep this header level with Standings*/}
                        <Panel title="Recent matches" padded={false} className="min-w-0" meta={matches && matches.length > RECENT_MATCH_COUNT
                            ? <Link to={`/matches?season=${seasonId}`} className="secondary-button px-3 py-0.5 text-sm">See all {matches.length}</Link>
                            : matches?.length ? `${matches.length} played` : undefined}>
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
                                    {matches.slice(0, RECENT_MATCH_COUNT).map((match) => (
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
                                {season.teams.map((team, index) => (
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

                    <h2 className="mt-10 mb-4 px-4 font-display text-3xl font-bold">Teams</h2>
                    {/*Each card's header and roster sit on rows shared across the grid row (subgrid), so a long team name that
                       wraps grows every header in its row and the rosters and averages still line up*/}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {season.teams.map((team) => {
                            const isChampion = team.name === season.winnerTeamName;
                            const missing = Math.max(0, TEAM_SIZE - team.members.length);
                            return (
                                <Panel key={team.teamId}
                                       title={<span className="font-display text-2xl font-bold">{team.name}</span>}
                                       meta={isChampion
                                           ? <span className="font-medium text-aegis">Champions</span>
                                           : <span className="figures">{team.wins}W {team.losses}L</span>}
                                       className={`row-span-2 grid grid-rows-subgrid gap-0 [&>div]:flex [&>div]:flex-col ${isChampion ? "ring-1 ring-aegis/70" : ""}`}
                                       level={3}
                                       padded={false}>
                                    <ul className="mb-1.5">
                                        {team.members.map(member => (
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
                                        {/*Untracked players, so the team still reads as five*/}
                                        {Array.from({length: missing}, (_, i) => (
                                            <li key={i} className="flex justify-between gap-3 px-3 py-1.5 text-ash">
                                                <span>Unknown player</span>
                                                <span aria-hidden="true">&ndash;</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="figures mt-auto flex justify-between border-t border-rule px-3 pt-2 pb-1 text-sm text-ash">
                                        <span>Average ELO</span>
                                        {/*Only covers the tracked players, so it would mislead*/}
                                        <span>{missing ? "–" : formatElo(team.avgElo)}</span>
                                    </p>
                                </Panel>
                            );
                        })}
                    </div>
                </>
            )}

            {/*Not while drafting: subs aren't in the pool, so they'd only push it further down*/}
            {started && (
                <Panel title="Subs" className="mt-4">
                    {subs.length ? signupList(subs) : <p className="text-ash">No subs for this season.</p>}
                </Panel>
            )}

            {user && (
                <FormDialog dialogRef={signupDialogRef} formRef={signupFormRef} onSubmit={handleSignup}
                            title={mySignup ? "Your sign-up" : `Join ${season.name}`}
                            mutation={{
                                isPending: signup.isPending,
                                isError: signup.isError || withdraw.isError,
                                error: signup.error ?? withdraw.error,
                                reset: () => {
                                    signup.reset();
                                    withdraw.reset();
                                },
                            }}
                            errorMessage="Couldn't update your sign-up. Refresh and try again."
                            extraButton={mySignup && (
                                <button type="button" className="secondary-button mr-auto text-danger"
                                        onClick={handleWithdraw} disabled={withdraw.isPending}>Withdraw</button>
                            )}
                            submitLabel={mySignup ? "Save" : "Sign up"}>
                    <fieldset>
                        <legend>Sign up as</legend>
                        <div className="mt-1 flex gap-4">
                            {[{value: false, label: "Player"}, {value: true, label: "Dedicated sub"}].map(({value, label}) => (
                                <label key={label} className="flex items-center gap-1.5">
                                    <input type="radio" name="signupType" checked={asSub === value}
                                           onChange={() => setAsSub(value)} className="accent-accent"/>
                                    {label}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    {asSub ? (
                        <p className="text-sm text-ash">Dedicated subs aren&apos;t put on a team. They fill in for a team when a player can&apos;t make it.</p>
                    ) : (<>
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
                    </>)}
                </FormDialog>
            )}

            {user?.admin && (
                <FormDialog dialogRef={deleteDialogRef} title="Delete season" onSubmit={handleDelete} mutation={deleteSeason}
                            errorMessage="Couldn't delete the season. Seasons with teams or matches can't be deleted."
                            confirmWord="delete" submitLabel="Delete season">
                    <p>This permanently deletes <strong>{season.name}</strong> and its sign-ups.</p>
                </FormDialog>
            )}

            {canAddMatch && (
                <FormDialog dialogRef={addMatchDialogRef} title="Add match" onSubmit={handleAddMatch} mutation={createMatch}
                            submitLabel="Add match" className="max-w-2xl"
                            // Keyed by the reviewed game, so its values fill the form's boxes afresh
                            formKey={prefill?.matchId ?? "new"}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            Dota match ID
                            <input name="matchId" required inputMode="numeric" pattern="\d+" title="The number in the game's Stratz or Dotabuff link"
                                   defaultValue={prefill?.matchId} autoComplete="off" className="text-input mt-2 block w-full"/>
                        </label>
                        <label className="block">
                            Played
                            <input name="playedTime" type="datetime-local" required min={`${season.startDate}T00:00`}
                                   defaultValue={prefill?.playedTime.slice(0, 16)} className="text-input mt-2 block w-full"/>
                        </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[
                            {side: "radiant", label: "Radiant", teamId: radiantTeamId, setTeamId: setRadiantTeamId},
                            {side: "dire", label: "Dire", teamId: direTeamId, setTeamId: setDireTeamId},
                        ].map(({side, label, teamId, setTeamId}) => {
                            const team = season.teams.find(t => t.teamId === teamId);
                            const names = boxNames[side] ?? team?.members.map(member => member.username) ?? [];
                            const replaced = team ? replacedMembers(names, team.members) : [];
                            return (
                                <fieldset key={side}>
                                    <legend>{label}</legend>
                                    <select value={teamId} onChange={(e) => {
                                        setTeamId(e.target.value);
                                        setBoxNames({...boxNames, [side]: undefined});
                                    }} required
                                            aria-label={`${label} team`} className="text-input mt-2 block w-full">
                                        {teamOptions}
                                    </select>
                                    {/*Keyed by team so picking another refills the roster. Typing over a name puts a sub in*/}
                                    {team && (
                                        <div key={team.teamId} className="mt-2 space-y-2">
                                            {team.members.map((member, i) => (
                                                <div key={member.steamId}>
                                                    <input name={side} list="match-player-names" required
                                                           defaultValue={names[i]} aria-label={`${label} player ${i + 1}`}
                                                           onChange={(e) => setBoxNames({...boxNames, [side]: names.map((name, j) => j === i ? e.target.value : name)})}
                                                           aria-describedby={replaced[i] ? `${side}-sub-${i}` : undefined}
                                                           autoComplete="off" spellCheck={false} className="text-input block w-full"/>
                                                    {replaced[i] && (
                                                        <p id={`${side}-sub-${i}`} className="mt-1 text-sm text-ash">Subbing for {replaced[i].username}</p>
                                                    )}
                                                </div>
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
                                    <input type="radio" name="winner" value={side} required defaultChecked={prefill?.winner === side}
                                           className="accent-accent"/>
                                    {sideName[side]}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    <p className="text-sm text-ash">Anyone not on their side's team counts as a sub. Everyone's ELO is worked out again from this game on.</p>
                    {unknownNames.length > 0 && <p role="alert" className="text-sm text-ash">No player called {unknownNames.join(", ")}.</p>}
                </FormDialog>
            )}

            {canAddMatch && (
                <FormDialog dialogRef={forfeitDialogRef} formRef={forfeitFormRef} title="Record forfeit" onSubmit={handleForfeit}
                            mutation={createForfeit} submitLabel="Record forfeit">
                    {[
                        {name: "forfeitingTeamId", label: "Forfeited by"},
                        {name: "opponentTeamId", label: "Against"},
                    ].map(({name, label}) => (
                        <label key={name} className="block">
                            {label}
                            <select name={name} required defaultValue="" className="text-input mt-2 block w-full">
                                {teamOptions}
                            </select>
                        </label>
                    ))}
                    <label className="block">
                        Played
                        <input name="playedTime" type="datetime-local" required min={`${season.startDate}T00:00`}
                               className="text-input mt-2 block w-full"/>
                    </label>
                    <p className="text-sm text-ash">
                        A loss for the team that forfeited and a win for the other in the table. Both rosters get it on
                        their profiles. Nobody's ELO changes.
                    </p>
                </FormDialog>
            )}

            {canAddMatch && (
                <FormDialog dialogRef={leagueDialogRef} title="League ticket" onSubmit={handleSetLeague} mutation={setLeague}
                            submitLabel="Save" formKey={season.leagueId ?? "none"}>
                    <label className="block">
                        League ticket ID
                        <input name="leagueId" inputMode="numeric" pattern="\d+" title="The number in the ticket's OpenDota or Dotabuff league link"
                               defaultValue={season.leagueId ?? ""} autoComplete="off" className="text-input mt-2 block w-full"/>
                    </label>
                    <p className="text-sm text-ash">Games on the ticket are checked every 30 minutes. Leave it empty to stop.</p>
                </FormDialog>
            )}

            {user?.admin && season.status === "REGISTRATION" && (
                <FormDialog dialogRef={draftDialogRef} title="Start draft" onSubmit={handleStartDraft} mutation={startDraft}
                            submitLabel="Start draft">
                    <p>
                        This closes sign-ups for <strong>{season.name}</strong> and can&apos;t be undone. Players past a multiple
                        of 5 become subs, everyone else gets a draft score, and the first players willing to captain become captains.
                    </p>
                </FormDialog>
            )}

            {user?.admin && draftComplete && (
                <FormDialog dialogRef={startSeasonDialogRef} title="Start season" onSubmit={handleStartSeason} mutation={startSeason}
                            submitLabel="Start season">
                    <p>
                        This starts <strong>{season.name}</strong> with the teams as drafted. Captains can&apos;t rename their teams
                        after this, and matches can be added.
                    </p>
                    {defaultNamed > 0 && (
                        <p className="text-sm text-ash">
                            {defaultNamed === 1 ? "1 team still has its default name." : `${defaultNamed} teams still have their default name.`}
                        </p>
                    )}
                </FormDialog>
            )}

            {canAddMatch && (
                <FormDialog dialogRef={endDialogRef} title="End season" onSubmit={handleEnd} mutation={completeSeason}
                            confirmWord="end" submitLabel="End season">
                    <label className="block">
                        Champions
                        <select value={winnerTeamId} onChange={(e) => setWinnerTeamId(e.target.value)} required
                                className="text-input mt-2 block w-full">
                            {teamOptions}
                        </select>
                    </label>
                    <p>
                        This marks <strong>{season.name}</strong> as completed
                        {winnerTeamId && <> with <strong>{season.teams.find(t => t.teamId === winnerTeamId)?.name}</strong> as champions</>}.
                        No more matches can be added, and the winner can't be changed.
                    </p>
                </FormDialog>
            )}
        </Page>
    );
}
