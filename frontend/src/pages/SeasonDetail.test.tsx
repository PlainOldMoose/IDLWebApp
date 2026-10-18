import {beforeEach, expect, it, vi} from "vitest";
import {fireEvent, render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter, Route, Routes} from "react-router";
import SeasonDetail from "./SeasonDetail";
import type {BinMatch, LeagueSync, PlayerSummary, SeasonDetail as SeasonDetailData, SeasonSignup, SteamUser} from "../types.ts";

const signup = (steamId: string, sub = false): SeasonSignup => ({
    steamId, username: steamId, rolePreference: sub ? null : "any", willingToCaptain: false, signedUpAt: "2026-01-01T12:00", sub,
});

let posted: unknown;
let postedTo: string | undefined;
let writes: {method: string, path: string, body: unknown}[];
let fetched: string[];

function renderSeason({status = "REGISTRATION", signups, user = null, name = "Season 5", teams = [], players = [], leagueId, league, bin = [], restoreFails, forfeitFails}: {
    status?: SeasonDetailData["status"], signups: SeasonSignup[], user?: SteamUser | null, name?: string, teams?: SeasonDetailData["teams"],
    players?: PlayerSummary[], leagueId?: number, league?: LeagueSync, bin?: BinMatch[], restoreFails?: string, forfeitFails?: string
}) {
    const season: SeasonDetailData = {id: "s1", name, startDate: "2026-02-01", endDate: "2026-03-01", status, teams, leagueId};
    vi.stubGlobal("fetch", vi.fn(async (path: string, init?: RequestInit) => {
        fetched.push(path);
        if (init?.method === "POST") {
            postedTo = path;
            posted = init.body ? JSON.parse(String(init.body)) : undefined;
        }
        if (init?.method && init.method !== "GET") {
            writes.push({method: init.method, path, body: init.body ? JSON.parse(String(init.body)) : undefined});
        }
        if (restoreFails && path.endsWith("/restore")) {
            return new Response(JSON.stringify({detail: restoreFails}), {status: 409});
        }
        if (forfeitFails && path === "/api/matches/forfeits") {
            return new Response(JSON.stringify({detail: forfeitFails}), {status: 400});
        }
        const body = path === "/auth/me" ? user
            : path === "/api/seasons/s1" ? season
            : path === "/api/seasons/s1/signups" ? signups
            : path === "/api/players" ? players
            : path === "/api/seasons/s1/league" ? league
            : path === "/api/matches/bin?seasonId=s1" ? bin
            : [];
        return new Response(JSON.stringify(body), {status: user || path !== "/auth/me" ? 200 : 401});
    }));
    render(
        <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
            <MemoryRouter initialEntries={["/seasons/s1"]}>
                <Routes><Route path="/seasons/:seasonId" element={<SeasonDetail/>}/></Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );
}

// The admin's Add menu, then one of its entries
const openAddMenu = async (entry: "Match" | "Forfeit") => {
    await userEvent.click(await screen.findByRole("button", {name: "Add"}));
    await userEvent.click(screen.getByRole("menuitem", {name: entry}));
};

const panel = async (title: string) => (await screen.findByRole("heading", {name: title})).closest("section")!;

beforeEach(() => {
    posted = undefined;
    postedTo = undefined;
    writes = [];
    fetched = [];
    // NOTE: jsdom has no modal dialogs
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
});

it("lists dedicated subs apart from players while sign-ups are open", async () => {
    renderSeason({signups: [signup("alice"), signup("bob"), signup("carol", true)]});

    const players = await panel("Signed up");
    expect(await within(players).findByText("alice")).toBeTruthy();
    expect(within(players).queryByText("carol")).toBeNull();
    expect(within(players).getByText("2 players")).toBeTruthy();

    const subs = await panel("Subs");
    expect(within(subs).getByText("carol")).toBeTruthy();
    expect(within(subs).queryByText("alice")).toBeNull();

    const stat = (label: string) => screen.getByText(label, {selector: "dt"}).nextElementSibling?.textContent;
    expect(stat("Players")).toBe("2");
    expect(stat("Subs")).toBe("1");
});

it("signs up as a dedicated sub without roles or captaincy", async () => {
    renderSeason({signups: [signup("alice")], user: {steamId: "dave", username: "dave", admin: false}});

    await userEvent.click(await screen.findByRole("button", {name: "Join now"}));
    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByRole("radio", {name: "Dedicated sub"}));

    expect(within(dialog).queryByLabelText("Your roles, most wanted first")).toBeNull();
    expect(within(dialog).queryByRole("checkbox", {name: "Willing to captain"})).toBeNull();

    await userEvent.click(within(dialog).getByRole("button", {name: "Sign up"}));
    await vi.waitFor(() => expect(posted).toEqual({rolePreference: null, willingToCaptain: false, sub: true}));
});

it("opens an existing sub sign-up as a sub", async () => {
    renderSeason({signups: [signup("carol", true)], user: {steamId: "carol", username: "carol", admin: false}});

    await userEvent.click(await screen.findByRole("button", {name: "Edit sign-up"}));
    const dialog = screen.getByRole("dialog");
    expect((within(dialog).getByRole("radio", {name: "Dedicated sub"}) as HTMLInputElement).checked).toBe(true);
});

it("keeps the subs list once the season has started", async () => {
    renderSeason({status: "ACTIVE", signups: [signup("alice"), signup("carol", true)]});

    const subs = await panel("Subs");
    expect(await within(subs).findByText("carol")).toBeTruthy();
    expect(within(subs).queryByText("alice")).toBeNull();
});

it("hides the subs list during the draft", async () => {
    renderSeason({status: "DRAFTING", signups: [signup("alice"), signup("carol", true)]});

    await screen.findByText("Drafting");
    expect(screen.queryByRole("heading", {name: "Subs"})).toBeNull();
});

it("says when a started season has no subs", async () => {
    renderSeason({status: "ACTIVE", signups: [signup("alice")]});

    const subs = await panel("Subs");
    expect(await within(subs).findByText("No subs for this season.")).toBeTruthy();
});

it("lets an admin close sign-ups and start the draft", async () => {
    renderSeason({signups: [signup("alice")], user: {steamId: "admin", username: "admin", admin: true}});

    await userEvent.click(await screen.findByRole("button", {name: "Start draft"}));
    const dialog = screen.getByRole("dialog", {name: "Start draft"});
    await userEvent.click(within(dialog).getByRole("button", {name: "Start draft"}));

    await vi.waitFor(() => expect(postedTo).toBe("/api/seasons/s1/draft"));
});

it("doesn't offer players the draft", async () => {
    renderSeason({signups: [signup("alice")], user: {steamId: "alice", username: "alice", admin: false}});

    await screen.findByRole("button", {name: "Edit sign-up"});
    expect(screen.queryByRole("button", {name: "Start draft"})).toBeNull();
});

it("labels a drafting season", async () => {
    renderSeason({status: "DRAFTING", signups: []});

    expect(await screen.findByText("Drafting")).toBeTruthy();
});

const team = (name: string, size: number): SeasonDetailData["teams"][number] => ({
    teamId: name, name, captainUsername: `${name}1`, avgElo: 1500, wins: 1, losses: 1,
    members: Array.from({length: size}, (_, i) => ({steamId: `${name}${i + 1}`, username: `${name}${i + 1}`, elo: 1500})),
});

const legacyNote = /This season comes from the old league records/;

it("warns that a season before Season 25 is legacy data", async () => {
    renderSeason({status: "COMPLETED", signups: [], name: "Season 24"});

    expect(await screen.findByText("Legacy season")).toBeTruthy();
    expect(screen.getByText(legacyNote)).toBeTruthy();
});

it.each(["Season 25", "Winter Cup"])("doesn't warn on %s", async (name) => {
    renderSeason({status: "COMPLETED", signups: [], name});
    await screen.findByRole("heading", {name});

    expect(screen.queryByText("Legacy season")).toBeNull();
    expect(screen.queryByText(legacyNote)).toBeNull();
});

it("fills a short team up to five with unknown players and hides its average", async () => {
    renderSeason({status: "COMPLETED", signups: [], name: "Season 30", teams: [team("short", 3)]});

    const card = await panel("short");
    const unknown = within(card).getAllByText("Unknown player");
    expect(unknown).toHaveLength(2);
    expect(unknown[0].closest("a")).toBeNull();
    expect(within(card).getAllByRole("link")).toHaveLength(3);
    expect(within(card).getByText("Average ELO").nextElementSibling?.textContent).toBe("–");
});

it("leaves a full team of five alone", async () => {
    renderSeason({status: "COMPLETED", signups: [], name: "Season 30", teams: [team("full", 5)]});

    const card = await panel("full");
    expect(within(card).queryByText("Unknown player")).toBeNull();
    expect(within(card).getByText("Average ELO").nextElementSibling?.textContent).toBe("1,500.0");
});

it("records who a sub replaced from the box they were typed into", async () => {
    const red = team("red", 5);
    const blue = team("blue", 5);
    const players = [...red.members, ...blue.members, {steamId: "sub1", username: "sub1", elo: 1500}];
    renderSeason({status: "ACTIVE", signups: [], teams: [red, blue], players, user: {steamId: "admin", username: "admin", admin: true}});

    await openAddMenu("Match");
    const dialog = screen.getByRole("dialog", {name: "Add match"});
    await userEvent.type(within(dialog).getByRole("textbox", {name: "Dota match ID"}), "8652158100");
    fireEvent.change(within(dialog).getByLabelText("Played"), {target: {value: "2026-02-10T19:00"}});
    await userEvent.selectOptions(within(dialog).getByRole("combobox", {name: "Radiant team"}), "red");
    await userEvent.selectOptions(within(dialog).getByRole("combobox", {name: "Dire team"}), "blue");
    const box = within(dialog).getByRole("combobox", {name: "Radiant player 2"});

    await userEvent.clear(box);
    await userEvent.type(box, "sub1");
    expect(within(dialog).getByText("Subbing for red2")).toBeTruthy();
    await userEvent.clear(box);
    await userEvent.type(box, "red2");
    expect(within(dialog).queryByText(/Subbing for/)).toBeNull();

    await userEvent.clear(box);
    await userEvent.type(box, "sub1");
    await userEvent.click(within(dialog).getByRole("radio", {name: "Radiant"}));
    await userEvent.click(within(dialog).getByRole("button", {name: "Add match"}));

    expect(postedTo).toBe("/api/matches");
    expect(posted).toMatchObject({radiant: ["red1", "sub1", "red3", "red4", "red5"], subbingFor: {sub1: "red2"}});
});

// The league sync's queue: red played Radiant with sub1 in for red5; Dire had blue1-4 and an unregistered account
const ADMIN: SteamUser = {steamId: "admin", username: "admin", admin: true};
const red = team("red", 5);
const blue = team("blue", 5);
const sub1 = {steamId: "sub1", username: "sub1", elo: 1500};
const pendingMatch: LeagueSync["pending"][number] = {
    matchId: 7406531302, playedTime: "2026-02-10T19:00:00", winner: "DIRE", radiantTeamId: "red", direTeamId: "blue",
    radiant: [...red.members.slice(0, 4), sub1].map(({steamId, username}) => ({steamId, username})),
    dire: [...blue.members.slice(0, 4).map(({steamId, username}) => ({steamId, username})), {steamId: "76561198051995905", username: null}],
    reason: "1 unregistered account",
};
const syncState = (overrides: Partial<LeagueSync> = {}): LeagueSync =>
    ({syncedAt: "2026-02-10T20:00:00", error: null, pending: [pendingMatch], ...overrides});
const renderSynced = (league: LeagueSync, user: SteamUser = ADMIN) => renderSeason({
    status: "ACTIVE", signups: [], teams: [red, blue], players: [...red.members, ...blue.members, sub1], user, leagueId: 15728, league,
});

it("shows admins the ticketed games that need checking", async () => {
    renderSynced(syncState());

    const queue = await panel("Matches to check");
    expect(await within(queue).findByText(/7406531302/)).toBeTruthy();
    expect(within(queue).getByText("1 unregistered account")).toBeTruthy();
    expect(within(queue).getByRole("link", {name: /OpenDota/}).getAttribute("href")).toBe("https://www.opendota.com/matches/7406531302");
});

it("doesn't show players the league queue or ask for it", async () => {
    renderSynced(syncState(), {steamId: "red1", username: "red1", admin: false});

    await screen.findByRole("heading", {name: "Season 5"});
    expect(screen.queryByRole("heading", {name: "Matches to check"})).toBeNull();
    expect(fetched).not.toContain("/api/seasons/s1/league");
});

it("says when there's nothing to check", async () => {
    renderSynced(syncState({pending: []}));

    const queue = await panel("Matches to check");
    expect(await within(queue).findByText("Nothing to check. Ticketed games that can't be added on their own show up here.")).toBeTruthy();
});

it("reviews a queued game in the Add match form, filled in", async () => {
    renderSynced(syncState());

    const queue = await panel("Matches to check");
    await userEvent.click(await within(queue).findByRole("button", {name: "Review"}));
    const dialog = screen.getByRole("dialog", {name: "Add match"});

    expect((within(dialog).getByRole("textbox", {name: "Dota match ID"}) as HTMLInputElement).value).toBe("7406531302");
    expect((within(dialog).getByLabelText("Played") as HTMLInputElement).value).toBe("2026-02-10T19:00");
    expect((within(dialog).getByRole("combobox", {name: "Radiant team"}) as HTMLSelectElement).value).toBe("red");
    expect((within(dialog).getByRole("combobox", {name: "Dire team"}) as HTMLSelectElement).value).toBe("blue");
    expect((within(dialog).getByRole("combobox", {name: "Radiant player 1"}) as HTMLInputElement).value).toBe("red1");
    // The sub goes in the box of the member who didn't play
    expect((within(dialog).getByRole("combobox", {name: "Radiant player 5"}) as HTMLInputElement).value).toBe("sub1");
    expect(within(dialog).getByText("Subbing for red5")).toBeTruthy();
    // Nobody to fill in for the unregistered account
    expect((within(dialog).getByRole("combobox", {name: "Dire player 5"}) as HTMLInputElement).value).toBe("");
    expect((within(dialog).getByRole("radio", {name: "Dire"}) as HTMLInputElement).checked).toBe(true);
});

it("rejects a queued game", async () => {
    renderSynced(syncState());

    const queue = await panel("Matches to check");
    await userEvent.click(await within(queue).findByRole("button", {name: "Reject"}));

    await vi.waitFor(() => expect(writes).toContainEqual({method: "DELETE", path: "/api/seasons/s1/league/pending/7406531302", body: undefined}));
});

it("syncs the league on demand", async () => {
    renderSynced(syncState());

    await userEvent.click(await screen.findByRole("button", {name: "Sync now"}));

    await vi.waitFor(() => expect(postedTo).toBe("/api/seasons/s1/league/sync"));
});

it("says when the last sync failed", async () => {
    renderSynced(syncState({error: "Couldn't reach OpenDota"}));

    const queue = await panel("Matches to check");
    expect(await within(queue).findByText("Last sync failed: Couldn't reach OpenDota")).toBeTruthy();
    expect(within(queue).queryByText(/Last synced/)).toBeNull();
});

it("says when the league last synced", async () => {
    renderSynced(syncState());

    const queue = await panel("Matches to check");
    expect(await within(queue).findByText(/^Last synced /)).toBeTruthy();
});

it("sets the season's league ticket", async () => {
    renderSeason({status: "ACTIVE", signups: [], teams: [red, blue], user: ADMIN});

    await userEvent.click(await screen.findByRole("button", {name: "League ticket"}));
    const dialog = screen.getByRole("dialog", {name: "League ticket"});
    await userEvent.type(within(dialog).getByRole("textbox", {name: "League ticket ID"}), "15728");
    await userEvent.click(within(dialog).getByRole("button", {name: "Save"}));

    await vi.waitFor(() => expect(writes).toContainEqual({method: "PUT", path: "/api/seasons/s1/league", body: {leagueId: 15728}}));
});

it("leaves the winner to the admin when the sync doesn't know it", async () => {
    renderSynced(syncState({pending: [{...pendingMatch, winner: null, reason: "OpenDota doesn't have this game"}]}));

    const queue = await panel("Matches to check");
    await userEvent.click(await within(queue).findByRole("button", {name: "Review"}));
    const dialog = screen.getByRole("dialog", {name: "Add match"});

    expect((within(dialog).getByRole("radio", {name: "Radiant"}) as HTMLInputElement).checked).toBe(false);
    expect((within(dialog).getByRole("radio", {name: "Dire"}) as HTMLInputElement).checked).toBe(false);
});

// Local times, as the API sends them
const localIso = (offsetDays: number) => {
    const date = new Date(Date.now() + offsetDays * 86400000);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
};
const binned: BinMatch = {
    matchId: 9036873306, radiantTeamName: "red", direTeamName: "blue", winner: "DIRE", deletedAt: localIso(-2), purgeAt: localIso(5), forfeit: false,
};
const renderBin = (options: {bin?: BinMatch[], user?: SteamUser, restoreFails?: string} = {}) => renderSeason({
    status: "ACTIVE", signups: [], teams: [red, blue], user: options.user ?? ADMIN, bin: options.bin ?? [binned], restoreFails: options.restoreFails,
});

it("shows admins the season's recently deleted matches", async () => {
    renderBin();

    const recent = await panel("Recently deleted");
    expect(await within(recent).findByText("9036873306")).toBeTruthy();
    expect(within(recent).getByText("red vs blue · Dire won")).toBeTruthy();
    expect(within(recent).getByText("Deleted 2 days ago · goes in 5 days")).toBeTruthy();
});

// Red didn't show; the made-up ID means nothing to an admin
it("shows a deleted forfeit as a forfeit", async () => {
    renderBin({bin: [{...binned, matchId: -1, forfeit: true}]});

    const recent = await panel("Recently deleted");
    expect(await within(recent).findByText("Forfeit")).toBeTruthy();
    expect(within(recent).getByText("red forfeited to blue")).toBeTruthy();
    expect(within(recent).queryByText("-1")).toBeNull();
});

it("hides an empty bin", async () => {
    renderBin({bin: []});

    await screen.findByRole("button", {name: "Add"});
    await vi.waitFor(() => expect(fetched).toContain("/api/matches/bin?seasonId=s1"));
    expect(screen.queryByRole("heading", {name: "Recently deleted"})).toBeNull();
});

it("doesn't show players the bin or ask for it", async () => {
    renderBin({user: {steamId: "red1", username: "red1", admin: false}});

    await screen.findByRole("heading", {name: "Season 5"});
    expect(screen.queryByRole("heading", {name: "Recently deleted"})).toBeNull();
    expect(fetched).not.toContain("/api/matches/bin?seasonId=s1");
});

it("restores a deleted match", async () => {
    renderBin();

    const recent = await panel("Recently deleted");
    await userEvent.click(await within(recent).findByRole("button", {name: "Restore"}));

    await vi.waitFor(() => expect(postedTo).toBe("/api/matches/9036873306/restore"));
});

it("says why a restore failed", async () => {
    renderBin({restoreFails: "Match 9036873306 is already recorded"});

    const recent = await panel("Recently deleted");
    await userEvent.click(await within(recent).findByRole("button", {name: "Restore"}));

    expect(await within(recent).findByText("Match 9036873306 is already recorded")).toBeTruthy();
});

// Forfeit behaviours 13 and 14: red didn't show against blue
const recordForfeit = async () => {
    await openAddMenu("Forfeit");
    const dialog = screen.getByRole<HTMLDialogElement>("dialog", {name: "Record forfeit"});
    await userEvent.selectOptions(within(dialog).getByRole("combobox", {name: "Forfeited by"}), "red");
    await userEvent.selectOptions(within(dialog).getByRole("combobox", {name: "Against"}), "blue");
    fireEvent.change(within(dialog).getByLabelText("Played"), {target: {value: "2026-02-10T19:00"}});
    await userEvent.click(within(dialog).getByRole("button", {name: "Record forfeit"}));
    return dialog;
};

it("records a forfeit from the Add menu", async () => {
    renderSeason({status: "ACTIVE", signups: [], teams: [red, blue], user: ADMIN});

    const dialog = await recordForfeit();

    await vi.waitFor(() => expect(postedTo).toBe("/api/matches/forfeits"));
    expect(posted).toEqual({seasonId: "s1", playedTime: "2026-02-10T19:00", forfeitingTeamId: "red", opponentTeamId: "blue"});
    await vi.waitFor(() => expect(dialog.open).toBe(false));
});

it("says why a forfeit was refused", async () => {
    renderSeason({status: "ACTIVE", signups: [], teams: [red, blue], user: ADMIN, forfeitFails: "A team can't play itself"});

    const dialog = await recordForfeit();

    expect(await within(dialog).findByRole("alert")).toHaveProperty("textContent", "A team can't play itself");
    expect(dialog.open).toBe(true);
});
