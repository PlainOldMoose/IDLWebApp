import {expect, it, vi} from "vitest";
import {render, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter, Route, Routes} from "react-router";
import PlayerDetail from "./PlayerDetail";
import type {PlayerDetail as PlayerDetailData, PlayerMatchSummary} from "../types.ts";

// Newest first, as the API returns them
const playedMatches = (count: number): PlayerMatchSummary[] => Array.from({length: count}, (_, i) => ({
    matchId: count - i, timePlayed: `2026-01-01T20:00:00`, won: i % 2 === 0, side: "RADIANT", sub: false,
    eloChange: 10, seasonId: null, seasonName: null, forfeit: false,
}));

function renderProfile(matchCount: number | PlayerMatchSummary[], {admin = false, disabledAt = null as string | null} = {}) {
    const matches = typeof matchCount === "number" ? playedMatches(matchCount) : matchCount;
    const player: PlayerDetailData = {
        steamId: "76561197960265729", username: "Antab", elo: 1600,
        wins: matches.filter(m => m.won).length, losses: matches.filter(m => !m.won).length, winRate: 50,
        disabled: disabledAt !== null, disabledAt,
        matches,
    };
    const fetch = vi.fn<(path: string, init?: RequestInit) => Promise<Response>>(async path => {
        // The player list leaves disabled players out
        if (path === "/api/players") return new Response(JSON.stringify(player.disabled ? [] : [player]));
        if (path === "/auth/me") return admin
            ? new Response(JSON.stringify({steamId: "76561197960265730", username: "Admin", admin: true}))
            : new Response(null, {status: 401});
        if (path.endsWith("/disabled")) return new Response(null, {status: 204});
        return new Response(JSON.stringify(player));
    });
    vi.stubGlobal("fetch", fetch);
    render(
        <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
            <MemoryRouter initialEntries={[`/players/${player.steamId}`]}>
                <Routes><Route path="/players/:steamId" element={<PlayerDetail/>}/></Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );
    return fetch;
}

// Behaviour 3
it("shows at most 20 matches on the profile", async () => {
    renderProfile(25);

    const history = await screen.findByRole("region", {name: "Match history"});
    expect(within(history).getAllByRole("link", {name: /^(Won|Lost)/})).toHaveLength(20);
});

// Behaviour 4
it("links to the full history when there are more than 20 matches", async () => {
    renderProfile(21);

    const history = await screen.findByRole("region", {name: "Match history"});
    expect(within(history).getByRole("link", {name: "See all"}).getAttribute("href")).toBe("/players/76561197960265729/matches");
});

it("hides See all when every match already shows", async () => {
    renderProfile(20);

    const history = await screen.findByRole("region", {name: "Match history"});
    expect(within(history).queryByRole("link", {name: "See all"})).toBeNull();
});

// Forfeit behaviour 12: which side of the forfeit they were on, and no ELO for it
it("labels forfeits as forfeit wins and losses", async () => {
    const [won, lost] = playedMatches(2);
    renderProfile([{...won, forfeit: true, eloChange: null}, {...lost, forfeit: true, eloChange: null}]);

    const history = await screen.findByRole("region", {name: "Match history"});
    expect(within(history).getByText("Forfeit win")).toBeTruthy();
    expect(within(history).getByText("Forfeit loss")).toBeTruthy();
    expect(within(history).getAllByText("Forfeit")).toHaveLength(2);
    expect(within(history).queryByText("No ELO record")).toBeNull();

    const recent = screen.getByRole("list", {name: /^Last 2 matches/});
    expect(within(recent).getByRole("link", {name: /^Forfeit win on /})).toBeTruthy();
    expect(within(recent).getByRole("link", {name: /^Forfeit loss on /})).toBeTruthy();
});

// Disabled behaviour 19: "inactive" in public, whether banned or just gone quiet, and no place on the ladder
it("shows a disabled player as inactive, with no rank", async () => {
    renderProfile(3, {disabledAt: "2026-10-01T12:00:00"});

    expect(await screen.findByText(/^Inactive since 1 Oct 2026/)).toBeTruthy();
    expect(screen.queryByText(/^Rank \d+ of/)).toBeNull();
    // Their history still shows
    expect(within(screen.getByRole("region", {name: "Match history"})).getAllByRole("link", {name: /^(Won|Lost)/})).toHaveLength(3);
});

const confirmIn = async (button: string, confirm: string) => {
    await userEvent.click(await screen.findByRole("button", {name: button}));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", {name: confirm}));
};

// Disabled behaviour 20
it("lets an admin disable a player after confirming", async () => {
    const fetch = renderProfile(3, {admin: true});

    await confirmIn("Disable player", "Disable");

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/players/76561197960265729/disabled", expect.objectContaining({method: "PUT"})));
});

// Disabled behaviour 21
it("lets an admin enable a disabled player after confirming", async () => {
    const fetch = renderProfile(3, {admin: true, disabledAt: "2026-10-01T12:00:00"});

    await confirmIn("Enable player", "Enable");

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/players/76561197960265729/disabled", expect.objectContaining({method: "DELETE"})));
});

// Disabled behaviour 22
it("doesn't offer disabling to players", async () => {
    renderProfile(3);

    await screen.findByRole("region", {name: "Match history"});
    expect(screen.queryByRole("button", {name: "Disable player"})).toBeNull();
});

it("doesn't offer enabling to players", async () => {
    renderProfile(3, {disabledAt: "2026-10-01T12:00:00"});

    await screen.findByRole("region", {name: "Match history"});
    expect(screen.queryByRole("button", {name: "Enable player"})).toBeNull();
});
