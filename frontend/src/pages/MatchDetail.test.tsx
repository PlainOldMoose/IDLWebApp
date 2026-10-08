import {afterEach, beforeEach, expect, it, vi} from "vitest";
import {render, screen, within} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter, Route, Routes} from "react-router";
import MatchDetail from "./MatchDetail";
import type {MatchDetail as MatchDetailData} from "../types";

const seasonMatch: MatchDetailData = {
    match: {
        matchId: 1234, winner: "RADIANT", timePlayed: "2026-10-01T19:00:00", avgElo: 1600,
        seasonId: "season-41", seasonName: "Season 41", radiantTeamName: "Sporky Diver", direTeamName: "The Bad Guys",
    },
    players: [
        {steamId: "1", username: "Borky", side: "RADIANT", sub: false, subbingFor: null, eloBefore: 1600, eloChange: 10},
        {steamId: "2", username: "Dev", side: "DIRE", sub: false, subbingFor: null, eloBefore: 1600, eloChange: -10},
    ],
    radiantStanding: {position: 2, teamCount: 6, wins: 5, losses: 2},
    // Dire's first game of the season
    direStanding: {position: 6, teamCount: 6, wins: 0, losses: 0},
    radiantWinChance: 0.544,
};

const inhouse: MatchDetailData = {
    ...seasonMatch,
    match: {...seasonMatch.match, seasonId: undefined, seasonName: undefined, radiantTeamName: undefined, direTeamName: undefined},
    radiantStanding: null,
    direStanding: null,
    radiantWinChance: null,
};

let detail: MatchDetailData;

beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async (path: string) => path.startsWith("/api/matches/")
        ? new Response(JSON.stringify(detail))
        // Signed out
        : new Response(null, {status: 401})));
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
