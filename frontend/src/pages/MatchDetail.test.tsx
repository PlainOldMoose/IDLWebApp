import {afterEach, beforeEach, expect, it, vi} from "vitest";
import {render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter, Route, Routes} from "react-router";
import MatchDetail from "./MatchDetail";
import type {MatchDetail as MatchDetailData, SteamUser} from "../types";

type Player = MatchDetailData["players"][number];

// Extra players so a side has a full five
function fillers(side: Player["side"], count: number): Player[] {
    return Array.from({length: count}, (_, i) => ({
        steamId: `${side}${i}`, username: `${side} ${i}`, side, sub: false, subbingFor: null, eloBefore: 1600, eloChange: 0,
    }));
}

const seasonMatch: MatchDetailData = {
    match: {
        matchId: 1234, winner: "RADIANT", timePlayed: "2026-10-01T19:00:00", avgElo: 1600,
        seasonId: "season-41", seasonName: "Season 41", radiantTeamName: "Sporky Diver", direTeamName: "The Bad Guys", forfeit: false,
    },
    players: [
        {steamId: "1", username: "Borky", side: "RADIANT", sub: false, subbingFor: null, eloBefore: 1600, eloChange: 10},
        {steamId: "2", username: "Dev", side: "DIRE", sub: false, subbingFor: null, eloBefore: 1600, eloChange: -10},
        ...fillers("RADIANT", 4), ...fillers("DIRE", 4),
    ],
    radiantStanding: {position: 2, teamCount: 6, wins: 5, losses: 2},
    // Dire's first game of the season
    direStanding: {position: 6, teamCount: 6, wins: 0, losses: 0},
    radiantWinChance: 0.544,
    source: "MANUAL",
};

const inhouse: MatchDetailData = {
    ...seasonMatch,
    match: {...seasonMatch.match, seasonId: undefined, seasonName: undefined, radiantTeamName: undefined, direTeamName: undefined},
    radiantStanding: null,
    direStanding: null,
    radiantWinChance: null,
};

let detail: MatchDetailData;
let user: SteamUser | null;

beforeEach(() => {
    user = null;
    vi.stubGlobal("fetch", vi.fn(async (path: string) => path.startsWith("/api/matches/")
        ? new Response(JSON.stringify(detail))
        : path === "/auth/me" && user ? new Response(JSON.stringify(user))
        // Signed out
        : new Response(null, {status: 401})));
    // NOTE: jsdom has no modal dialogs
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
});

afterEach(() => vi.unstubAllGlobals());

const renderMatch = () => render(
    <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
        <MemoryRouter initialEntries={["/matches/1234"]}>
            <Routes>
                <Route path="/matches/:matchId" element={<MatchDetail/>}/>
            </Routes>
        </MemoryRouter>
    </QueryClientProvider>
);

// The team's panel, found by its heading
const teamPanel = async (name: string) => (await screen.findByRole("heading", {level: 2, name: new RegExp(name)})).closest("section")!;

// A stat's label and value read together, e.g. "Standing2nd of 6"
const stat = (panel: HTMLElement, label: string) => within(panel).getByText(label).parentElement!.textContent;

it("shows each team's season standing going into the match", async () => {
    detail = seasonMatch;
    renderMatch();
    const radiant = await teamPanel("Sporky Diver");

    expect(stat(radiant, "Standing")).toBe("Standing2nd of 6");
    expect(stat(radiant, "Record")).toBe("Record5W 2L");
    expect(stat(radiant, "Win rate")).toBe("Win rate71%");
    expect(within(radiant).getByRole("heading", {name: "Coming into this match"})).toBeTruthy();
});

it("shows dashes for a team's first game of the season", async () => {
    detail = seasonMatch;
    renderMatch();
    const dire = await teamPanel("The Bad Guys");

    expect(stat(dire, "Standing")).toBe("Standing–");
    expect(stat(dire, "Record")).toBe("Record0W 0L");
    expect(stat(dire, "Win rate")).toBe("Win rate–");
});

it("shows no standings for an in-house", async () => {
    detail = inhouse;
    renderMatch();
    await screen.findByRole("heading", {name: /Radiant victory/});

    expect(screen.queryByText("Standing")).toBeNull();
});

it("shows each team's pre-game win chance from the API, adding up to 100", async () => {
    detail = seasonMatch;
    renderMatch();
    const odds = (await screen.findByRole("heading", {level: 2, name: "Pre-game odds"})).closest("section")!;

    expect(stat(odds, "Sporky Diver")).toBe("Sporky Diver54%");
    expect(stat(odds, "The Bad Guys")).toBe("The Bad Guys46%");
});

it("shows no pre-game odds without a win chance", async () => {
    detail = inhouse;
    renderMatch();
    await screen.findByRole("heading", {name: /Radiant victory/});

    expect(screen.queryByRole("heading", {name: "Pre-game odds"})).toBeNull();
});

// Three on Radiant (none padded on Dire), so Radiant needs two unknowns
const shortRadiant: MatchDetailData = {...seasonMatch, players: [...fillers("RADIANT", 3), ...fillers("DIRE", 5)]};

it("fills a short side up to five with unknown players and hides its average", async () => {
    detail = shortRadiant;
    renderMatch();
    const radiant = await teamPanel("Sporky Diver");
    const dire = await teamPanel("The Bad Guys");

    const unknown = within(radiant).getAllByText("Unknown player");
    expect(unknown).toHaveLength(2);
    expect(unknown[0].closest("a")).toBeNull();
    expect(within(radiant).queryByText(/avg$/)).toBeNull();
    expect(within(dire).queryByText("Unknown player")).toBeNull();
    expect(within(dire).getByText(/avg$/)).toBeTruthy();
});

it("hides a team's average when one of its players has no ELO record", async () => {
    const unrecorded: Player = {steamId: "9", username: "Untracked", side: "RADIANT", sub: false, subbingFor: null, eloBefore: null, eloChange: null};
    detail = {...seasonMatch, players: [...fillers("RADIANT", 4), unrecorded, ...fillers("DIRE", 5)]};
    renderMatch();
    const radiant = await teamPanel("Sporky Diver");
    const dire = await teamPanel("The Bad Guys");

    expect(within(radiant).queryByText(/avg$/)).toBeNull();
    expect(within(dire).getByText(/avg$/)).toBeTruthy();
});

it("counts a sub as filling the missing player's slot", async () => {
    const sub: Player = {steamId: "9", username: "Subby", side: "RADIANT", sub: true, subbingFor: "Gone", eloBefore: 1600, eloChange: 0};
    detail = {...seasonMatch, players: [...fillers("RADIANT", 4), sub, ...fillers("DIRE", 5)]};
    renderMatch();
    const radiant = await teamPanel("Sporky Diver");

    expect(within(radiant).getByText("Subby")).toBeTruthy();
    expect(within(radiant).queryByText("Unknown player")).toBeNull();
    expect(within(radiant).getByText(/avg$/)).toBeTruthy();
});

it("warns that a match from before Season 25 is legacy data", async () => {
    detail = {...seasonMatch, match: {...seasonMatch.match, seasonName: "Season 24"}};
    renderMatch();

    expect(await screen.findByRole("heading", {name: "Legacy season"})).toBeTruthy();
    expect(screen.getByText(/This match comes from the old league records/)).toBeTruthy();
});

it.each([["Season 41", seasonMatch], ["an in-house", inhouse]])("doesn't warn on %s", async (_, match) => {
    detail = match;
    renderMatch();
    await screen.findByRole("heading", {name: /victory/});

    expect(screen.queryByRole("heading", {name: "Legacy season"})).toBeNull();
});

it("shows the match's average ELO in the subtitle when it's recorded", async () => {
    detail = seasonMatch;
    renderMatch();

    expect(await screen.findByText("1,600 avg ELO")).toBeTruthy();
});

it("leaves the average ELO out of the subtitle when it isn't recorded", async () => {
    detail = {...seasonMatch, match: {...seasonMatch.match, avgElo: null}};
    renderMatch();

    await screen.findByText("Match 1234");
    expect(screen.queryByText(/avg ELO/)).toBeNull();
});

const ADMIN: SteamUser = {steamId: "admin", username: "admin", admin: true};
const manualWarning = "This match is not tracked by the API, likely because it was not ticketed properly. The sync button will not retrieve this match, you will have to re-add it manually.";

it.each([["MANUAL", "Manually added by an Admin"], ["API_SYNC", "API synced"]] as const)("tells admins a %s match is %s", async (source, label) => {
    detail = {...seasonMatch, source};
    user = ADMIN;
    renderMatch();

    expect(await screen.findByText(label)).toBeTruthy();
});

it("doesn't show players where a match came from", async () => {
    detail = seasonMatch;
    user = {steamId: "1", username: "Borky", admin: false};
    renderMatch();

    await screen.findByText("Borky");
    expect(screen.queryByText("Manually added by an Admin")).toBeNull();
});

// Behaviour 59: both kinds can be restored for a week, so both get the same line
it.each(["MANUAL", "API_SYNC"] as const)("says a deleted %s match goes to the bin", async (source) => {
    detail = {...seasonMatch, source};
    user = ADMIN;
    renderMatch();

    await userEvent.click(await screen.findByRole("button", {name: "Delete match"}));
    const dialog = screen.getByRole("dialog", {name: "Delete match"});

    expect(within(dialog).getByText("It goes to Recently deleted for 7 days, where you can restore it.")).toBeTruthy();
    expect(within(dialog).queryByText(manualWarning)).toBeNull();
    expect(within(dialog).queryByText("The sync won't add it back. Add match can.")).toBeNull();
});

// Forfeit behaviour 11: The Bad Guys didn't show. No Dota game, so no ELO, odds or Stratz page
const forfeit: MatchDetailData = {
    ...seasonMatch,
    match: {...seasonMatch.match, matchId: -1, winner: "DIRE", avgElo: null, radiantTeamName: "The Bad Guys", direTeamName: "Sporky Diver", forfeit: true},
    players: seasonMatch.players.map(p => ({...p, side: p.side === "RADIANT" ? "DIRE" : "RADIANT", eloBefore: null, eloChange: null})),
    radiantWinChance: null,
};

it("shows a forfeit as who forfeited, with both rosters and no ELO", async () => {
    detail = forfeit;
    user = ADMIN;
    renderMatch();

    expect(await screen.findByRole("heading", {level: 1, name: "The Bad Guys forfeited"})).toBeTruthy();
    expect(screen.getByText("Borky")).toBeTruthy();
    expect(screen.getByText("Dev")).toBeTruthy();
    expect(screen.queryByText("No ELO record")).toBeNull();
    expect(screen.queryByRole("link", {name: "Open on Stratz"})).toBeNull();
    expect(screen.queryByRole("heading", {name: "Pre-game odds"})).toBeNull();
    expect(screen.queryByText("Match -1")).toBeNull();
    expect(screen.getByRole("button", {name: "Delete match"})).toBeTruthy();
});
