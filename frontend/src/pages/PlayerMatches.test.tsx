import {expect, it, vi} from "vitest";
import {render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter, Route, Routes} from "react-router";
import PlayerMatches from "./PlayerMatches";
import type {PlayerDetail, PlayerMatchSummary} from "../types.ts";

const steamId = "76561197960265729";

// Newest first, as the API returns them; ids count down so the newest is the highest
const match = (matchId: number, season: string | null): PlayerMatchSummary => ({
    matchId, timePlayed: "2026-01-01T20:00:00", won: true, side: "RADIANT", sub: false, eloChange: 10,
    seasonId: season, seasonName: season && `Season ${season}`, forfeit: false,
});
const range = (from: number, to: number, season: string | null) =>
    Array.from({length: from - to + 1}, (_, i) => match(from - i, season));

function renderHistory(matches: PlayerMatchSummary[] | null, search = "") {
    const player: PlayerDetail | null = matches && {
        steamId, username: "Antab", elo: 1600, wins: matches.length, losses: 0, winRate: 100, disabled: false, disabledAt: null, matches,
    };
    vi.stubGlobal("fetch", vi.fn(async () => player
        ? new Response(JSON.stringify(player))
        : new Response(JSON.stringify({detail: "Player not found"}), {status: 404})));
    render(
        <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
            <MemoryRouter initialEntries={[`/players/${steamId}/matches${search}`]}>
                <Routes><Route path="/players/:steamId/matches" element={<PlayerMatches/>}/></Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );
}

// Match ids of the rows on screen, top to bottom
const shownIds = async () => {
    const history = await screen.findByRole("region", {name: "Match history"});
    return within(history).queryAllByRole("link").map(row => Number(row.getAttribute("href")!.split("/").pop()));
};

// 50 matches: 50 down to 26 in Season 45, 25 down to 6 in Season 44, 5 down to 1 in-house
const history = [...range(50, 26, "45"), ...range(25, 6, "44"), ...range(5, 1, null)];

// Behaviour 5
it("shows the newest 20 matches first", async () => {
    renderHistory(history);

    expect(await shownIds()).toEqual(range(50, 31, null).map(m => m.matchId));
    expect(screen.getByText("Page 1 of 3")).toBeTruthy();
});

// Behaviour 6
it("pages older and back newer", async () => {
    renderHistory(history);
    const user = userEvent.setup();
    expect(await shownIds()).toHaveLength(20);

    expect((screen.getByRole("button", {name: "Newer"}) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", {name: "Older"}));
    expect(screen.getByText("Page 2 of 3")).toBeTruthy();
    expect((await shownIds())[0]).toBe(30);

    await user.click(screen.getByRole("button", {name: "Older"}));
    expect(await shownIds()).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect((screen.getByRole("button", {name: "Older"}) as HTMLButtonElement).disabled).toBe(true);

    await user.click(screen.getByRole("button", {name: "Newer"}));
    expect(screen.getByText("Page 2 of 3")).toBeTruthy();
});

// Behaviour 7
it("clamps a page past the end to the last page", async () => {
    renderHistory(history, "?page=99");

    expect(await shownIds()).toHaveLength(10);
    expect(screen.getByText("Page 3 of 3")).toBeTruthy();
});

it("treats a nonsense page as page 1", async () => {
    renderHistory(history, "?page=abc");

    expect((await shownIds())[0]).toBe(50);
    expect(screen.getByText("Page 1 of 3")).toBeTruthy();
});

// Behaviour 8
it("offers only the seasons the player has played, plus in-houses when they have one", async () => {
    renderHistory(history);
    await shownIds();

    const options = within(screen.getByRole("combobox", {name: "Season"})).getAllByRole("option").map(o => o.textContent);
    expect(options).toEqual(["All matches", "In-houses", "Season 45", "Season 44"]);
});

it("leaves out in-houses when the player has none", async () => {
    renderHistory(range(3, 1, "45"));
    await shownIds();

    const options = within(screen.getByRole("combobox", {name: "Season"})).getAllByRole("option").map(o => o.textContent);
    expect(options).toEqual(["All matches", "Season 45"]);
});

// Behaviour 9
it("filters to one season and goes back to page 1", async () => {
    renderHistory(history, "?page=3");
    const user = userEvent.setup();
    await shownIds();

    await user.selectOptions(screen.getByRole("combobox", {name: "Season"}), "Season 44");

    expect(await shownIds()).toEqual(range(25, 6, null).map(m => m.matchId));
    expect(screen.getByText("Page 1 of 1")).toBeTruthy();
});

// Behaviour 10
it("filters to in-houses from the URL", async () => {
    renderHistory(history, "?season=inhouse");

    expect(await shownIds()).toEqual([5, 4, 3, 2, 1]);
});

// Behaviour 11
it("says when the player has no matches yet", async () => {
    renderHistory([]);

    expect(await screen.findByText(/No matches recorded yet/)).toBeTruthy();
});

it("says when the player doesn't exist", async () => {
    renderHistory(null);

    expect(await screen.findByRole("heading", {name: "Player not found"})).toBeTruthy();
});
