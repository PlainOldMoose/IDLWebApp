import {expect, it, vi} from "vitest";
import {render, screen, within} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter, Route, Routes} from "react-router";
import PlayerDetail from "./PlayerDetail";
import type {PlayerDetail as PlayerDetailData, PlayerMatchSummary} from "../types.ts";

// Newest first, as the API returns them
const playedMatches = (count: number): PlayerMatchSummary[] => Array.from({length: count}, (_, i) => ({
    matchId: count - i, timePlayed: `2026-01-01T20:00:00`, won: i % 2 === 0, side: "RADIANT", sub: false,
    eloChange: 10, seasonId: null, seasonName: null,
}));

function renderProfile(matchCount: number) {
    const matches = playedMatches(matchCount);
    const player: PlayerDetailData = {
        steamId: "76561197960265729", username: "Antab", elo: 1600,
        wins: matches.filter(m => m.won).length, losses: matches.filter(m => !m.won).length, winRate: 50,
        matches,
    };
    vi.stubGlobal("fetch", vi.fn(async (path: string) => path === "/api/players"
        ? new Response(JSON.stringify([player]))
        : new Response(JSON.stringify(player))));
    render(
        <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
            <MemoryRouter initialEntries={[`/players/${player.steamId}`]}>
                <Routes><Route path="/players/:steamId" element={<PlayerDetail/>}/></Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );
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
