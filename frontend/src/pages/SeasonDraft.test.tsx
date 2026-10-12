import {beforeEach, expect, it, vi} from "vitest";
import {render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter, Route, Routes} from "react-router";
import SeasonDetail from "./SeasonDetail";
import type {Draft, DraftPlayer, SeasonDetail as SeasonDetailData, SteamUser} from "../types.ts";

const player = (username: string, draftScore: number): DraftPlayer => ({
    steamId: username.toLowerCase(), username, elo: 1500, draftScore, rolePreference: "any", willingToCaptain: false,
});

const custard = player("Custard", 251);
const jabba = player("Jabba", 326);
const gron = player("Gron", 1070);
const andrew = player("AndrewC", 952);

// Custard's team is on the clock with the lower total
const fullDraft: Draft = {
    pool: [gron, andrew],
    teams: [
        {teamId: "t1", name: "Custard's team", captainSteamId: "custard", members: [custard], draftScore: 251},
        {teamId: "t2", name: "Jabba's team", captainSteamId: "jabba", members: [jabba], draftScore: 326},
    ],
    onTheClockTeamId: "t1",
    teamCount: 2,
};

// One captain short of the two teams
const shortDraft: Draft = {
    pool: [gron, andrew, jabba],
    teams: [fullDraft.teams[0]],
    onTheClockTeamId: null,
    teamCount: 2,
};

const as = (steamId: string, admin = false): SteamUser => ({steamId, username: steamId, admin});

let sent: { method: string, path: string, body: unknown }[];

function renderDraft(draft: Draft, user: SteamUser | null = null) {
    const season: SeasonDetailData = {id: "s1", name: "Season 46", startDate: "2026-02-01", endDate: "2026-03-01", status: "DRAFTING", teams: []};
    vi.stubGlobal("fetch", vi.fn(async (path: string, init?: RequestInit) => {
        if (init?.method && init.method !== "GET") {
            sent.push({method: init.method, path, body: init.body ? JSON.parse(String(init.body)) : undefined});
            return new Response(null, {status: 204});
        }
        const body = path === "/auth/me" ? user
            : path === "/api/seasons/s1" ? season
            : path === "/api/seasons/s1/draft" ? draft
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

const section = async (title: string) => (await screen.findByRole("heading", {name: title})).closest("section")!;

beforeEach(() => {
    sent = [];
    // NOTE: jsdom has no modal dialogs
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
});

it("shows each team's total and who is on the clock", async () => {
    renderDraft(fullDraft);

    const custards = await section("Custard's team");
    expect(within(custards).getByText("Picking now")).toBeTruthy();
    expect(within(custards).getByText("251")).toBeTruthy();
    expect(within(custards).getByText("Custard")).toBeTruthy();

    const jabbas = await section("Jabba's team");
    expect(within(jabbas).queryByText("Picking now")).toBeNull();
    expect(within(jabbas).getByText("326")).toBeTruthy();
});

it("keeps the team on the clock in a bar above the pool for phones", async () => {
    renderDraft(fullDraft);

    const bar = await screen.findByRole("complementary", {name: "Picking now"});
    expect(within(bar).getByText("Custard's team")).toBeTruthy();
    expect(within(bar).getByText("1/5")).toBeTruthy();
    expect(within(bar).getByText("251")).toBeTruthy();
    expect(within(bar).getByRole("link", {name: "View teams"}).getAttribute("href")).toBe("#teams");
});

it("lists the pool highest score first", async () => {
    renderDraft(fullDraft);

    const pool = await section("Pool");
    expect(within(pool).getByText("2 left")).toBeTruthy();
    const rows = within(pool).getAllByRole("listitem");
    expect(rows.map(row => within(row).queryByText(/^(Gron|AndrewC)$/)?.textContent)).toEqual(["Gron", "AndrewC"]);
    expect(within(rows[0]).getByText("1070")).toBeTruthy();
});

it("lets the captain on the clock pick, once they confirm", async () => {
    renderDraft(fullDraft, as("custard"));

    await userEvent.click(await screen.findByRole("button", {name: "Pick Gron"}));
    const dialog = screen.getByRole("dialog", {name: "Confirm pick"});
    expect(within(dialog).getByText("Gron joins Custard's team. Picks can't be undone.")).toBeTruthy();
    expect(sent).toEqual([]);
    await userEvent.click(within(dialog).getByRole("button", {name: "Pick Gron"}));

    await vi.waitFor(() => expect(sent).toContainEqual({method: "POST", path: "/api/seasons/s1/draft/picks", body: {steamId: "gron"}}));
});

it("doesn't pick when the confirmation is cancelled", async () => {
    renderDraft(fullDraft, as("custard"));

    await userEvent.click(await screen.findByRole("button", {name: "Pick Gron"}));
    await userEvent.click(within(screen.getByRole("dialog", {name: "Confirm pick"})).getByRole("button", {name: "Cancel"}));

    expect(screen.queryByRole("dialog", {name: "Confirm pick"})).toBeNull();
    expect(sent).toEqual([]);
});

it("doesn't let other captains or players pick", async () => {
    renderDraft(fullDraft, as("jabba"));

    await section("Pool");
    expect(screen.queryByRole("button", {name: /^Pick /})).toBeNull();
});

it("lets an admin pick for the captain on the clock", async () => {
    renderDraft(fullDraft, as("someadmin", true));

    await userEvent.click(await screen.findByRole("button", {name: "Pick AndrewC"}));
    await userEvent.click(within(screen.getByRole("dialog", {name: "Confirm pick"})).getByRole("button", {name: "Pick AndrewC"}));

    await vi.waitFor(() => expect(sent).toContainEqual({method: "POST", path: "/api/seasons/s1/draft/picks", body: {steamId: "andrewc"}}));
});

it("says how many captains are missing, and nobody can pick yet", async () => {
    renderDraft(shortDraft, as("custard"));

    expect(await screen.findByText("Needs 1 more captain before the draft can start.")).toBeTruthy();
    expect(screen.queryByRole("button", {name: /^Pick /})).toBeNull();
    expect(screen.queryByRole("button", {name: /captain$/})).toBeNull();
});

it("lets an admin make and remove captains before the first pick", async () => {
    renderDraft(shortDraft, as("someadmin", true));

    await userEvent.click(await screen.findByRole("button", {name: "Make Jabba captain"}));
    await vi.waitFor(() => expect(sent).toContainEqual({method: "PUT", path: "/api/seasons/s1/draft/captains/jabba", body: undefined}));

    await userEvent.click(screen.getByRole("button", {name: "Remove Custard as captain"}));
    await vi.waitFor(() => expect(sent).toContainEqual({method: "DELETE", path: "/api/seasons/s1/draft/captains/custard", body: undefined}));
});

it("fixes the captains once a pick is made", async () => {
    const picked: Draft = {
        ...fullDraft,
        pool: [andrew],
        teams: [{...fullDraft.teams[0], members: [custard, gron], draftScore: 1321}, fullDraft.teams[1]],
        onTheClockTeamId: "t2",
    };
    renderDraft(picked, as("someadmin", true));

    await section("Pool");
    expect(screen.queryByRole("button", {name: /^Make .* captain$/})).toBeNull();
    expect(screen.queryByRole("button", {name: /^Remove .* as captain$/})).toBeNull();
});

it("lets a captain rename their own team", async () => {
    renderDraft(fullDraft, as("custard"));

    const jabbas = await section("Jabba's team");
    expect(within(jabbas).queryByRole("button", {name: "Rename team"})).toBeNull();

    await userEvent.click(within(await section("Custard's team")).getByRole("button", {name: "Rename team"}));
    const dialog = screen.getByRole("dialog");
    const name = within(dialog).getByLabelText("Team name");
    await userEvent.clear(name);
    await userEvent.type(name, "How to Moose your Dragon");
    await userEvent.click(within(dialog).getByRole("button", {name: "Save"}));

    await vi.waitFor(() => expect(sent).toContainEqual({method: "PUT", path: "/api/seasons/s1/draft/teams/t1", body: {name: "How to Moose your Dragon"}}));
});

// Every team full: one captain and four picks each
const completeDraft: Draft = {
    pool: [],
    teams: fullDraft.teams.map((team, t) => ({
        ...team,
        members: [team.members[0], ...[1, 2, 3, 4].map(i => player(`P${t}${i}`, 100))],
    })),
    onTheClockTeamId: null,
    teamCount: 2,
};

const renamed = (draft: Draft, ...teamIds: string[]): Draft => ({
    ...draft,
    teams: draft.teams.map(team => teamIds.includes(team.teamId) ? {...team, name: `${team.name} renamed`} : team),
});

const note = "Name your team before the season starts.";

it("greys out Start season in the header while picks remain", async () => {
    renderDraft(fullDraft, as("someadmin", true));

    await section("Pool");
    expect((screen.getByRole("button", {name: "Start season"}) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Drafting")).toBeTruthy();
});

it("hides the pool and labels the season draft complete after the last pick", async () => {
    renderDraft(completeDraft);

    await section("Custard's team");
    expect(screen.queryByRole("heading", {name: "Pool"})).toBeNull();
    expect(screen.getByText("Draft complete")).toBeTruthy();
    expect(screen.queryByText("Drafting")).toBeNull();
});

it("lets an admin start the season from the header once every team is full", async () => {
    renderDraft(completeDraft, as("someadmin", true));

    await section("Custard's team");
    const start = screen.getByRole("button", {name: "Start season"}) as HTMLButtonElement;
    expect(start.disabled).toBe(false);
    await userEvent.click(start);
    const dialog = screen.getByRole("dialog", {name: "Start season"});
    await userEvent.click(within(dialog).getByRole("button", {name: "Start season"}));

    await vi.waitFor(() => expect(sent).toContainEqual({method: "POST", path: "/api/seasons/s1/draft/start", body: undefined}));
});

it.each([
    {draft: completeDraft, warning: "2 teams still have their default name."},
    {draft: renamed(completeDraft, "t1"), warning: "1 team still has its default name."},
])("warns before starting with default team names: $warning", async ({draft, warning}) => {
    renderDraft(draft, as("someadmin", true));

    await section("Jabba's team");
    await userEvent.click(screen.getByRole("button", {name: "Start season"}));
    expect(within(screen.getByRole("dialog", {name: "Start season"})).getByText(warning)).toBeTruthy();
});

it("doesn't warn when every team has been named", async () => {
    renderDraft(renamed(completeDraft, "t1", "t2"), as("someadmin", true));

    await section("Custard's team renamed");
    await userEvent.click(screen.getByRole("button", {name: "Start season"}));
    expect(within(screen.getByRole("dialog", {name: "Start season"})).queryByText(/default name/)).toBeNull();
});

it("notes to a captain on a default name that they should rename their team", async () => {
    renderDraft(completeDraft, as("custard"));

    const prompt = (await screen.findByText(note)).parentElement!;
    await userEvent.click(within(prompt).getByRole("button", {name: "Rename team"}));

    const dialog = screen.getByRole("dialog", {name: "Rename team"});
    const name = within(dialog).getByRole("textbox", {name: "Team name"}) as HTMLInputElement;
    expect(name.value).toBe("Custard's team");
    await userEvent.clear(name);
    await userEvent.type(name, "Custard Pie");
    await userEvent.click(within(dialog).getByRole("button", {name: "Save"}));

    await vi.waitFor(() => expect(sent).toContainEqual({method: "PUT", path: "/api/seasons/s1/draft/teams/t1", body: {name: "Custard Pie"}}));
});

it.each([
    {who: "a captain whose team is named", draft: renamed(completeDraft, "t1"), user: as("custard")},
    {who: "a player who isn't a captain", draft: completeDraft, user: as("p01")},
    {who: "while picks remain", draft: fullDraft, user: as("custard")},
])("doesn't show the note to $who", async ({draft, user}) => {
    renderDraft(draft, user);

    await screen.findAllByRole("heading", {name: /team/});
    expect(screen.queryByText(note)).toBeNull();
});

it("lets captains rename after the last pick, but only admins start the season", async () => {
    renderDraft(completeDraft, as("custard"));

    expect(within(await section("Custard's team")).getByRole("button", {name: "Rename team"})).toBeTruthy();
    expect(screen.queryByRole("button", {name: "Start season"})).toBeNull();
});

