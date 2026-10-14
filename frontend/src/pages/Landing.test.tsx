import {expect, it, vi} from "vitest";
import {render, screen, within} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter} from "react-router";
import Landing from "./Landing";
import type {Season} from "../types.ts";

it("links to the rules", () => {
    vi.stubGlobal("fetch", vi.fn(async (path: string) => path === "/auth/me"
        ? new Response(null, {status: 401})
        : new Response(JSON.stringify([]))));
    render(
        <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
            <MemoryRouter><Landing/></MemoryRouter>
        </QueryClientProvider>
    );

    expect(screen.getByRole("link", {name: "Read the rules"}).getAttribute("href")).toBe("/rules");
});

const renderWithSeasons = (seasons: Season[]) => {
    vi.stubGlobal("fetch", vi.fn(async (path: string) => {
        if (path === "/auth/me") return new Response(null, {status: 401});
        return new Response(JSON.stringify(path === "/api/seasons" ? seasons : []));
    }));
    render(
        <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
            <MemoryRouter><Landing/></MemoryRouter>
        </QueryClientProvider>
    );
};

const season = (name: string, winnerTeamName: string | null = null, winnerPlayers: string[] = []): Season =>
    ({id: name, name, startDate: "2026-01-01", endDate: "2026-03-01", status: "COMPLETED", winnerTeamName, winnerPlayers});

// Behaviours 4 and 5
it("lists each season's champions, captain first, and links to the season", async () => {
    renderWithSeasons([season("Season 45"), season("Season 44", "Commando Elite", ["Antab", "ChaoticGun", "Dev"])]);

    const hall = await screen.findByRole("region", {name: "Hall of fame"});
    const entry = within(hall).getByRole("link", {name: /Commando Elite/});
    expect(entry.getAttribute("href")).toBe("/seasons/Season 44");
    expect(entry.textContent).toMatch(/Season 44/);
    // Captain in bold, named for screen readers
    expect(entry.textContent).toMatch(/Antab \(captain\), ChaoticGun, Dev/);
    expect(within(entry).getByText("Antab").tagName).toBe("STRONG");
    expect(within(hall).queryByText(/Season 45/)).toBeNull();
});

// Behaviour 6
it("says when no season has champions yet", async () => {
    renderWithSeasons([season("Season 1")]);

    const hall = await screen.findByRole("region", {name: "Hall of fame"});
    expect(within(hall).getByText("No champions yet. Winners appear here when a season ends.")).toBeTruthy();
});

it("shows the latest five champions and links to the rest", async () => {
    renderWithSeasons(["45", "44", "43", "42", "41", "40"].map(n => season(`Season ${n}`, `Team ${n}`, ["Cap"])));

    const hall = await screen.findByRole("region", {name: "Hall of fame"});
    expect(within(hall).getByText("Team 41")).toBeTruthy();
    expect(within(hall).queryByText("Team 40")).toBeNull();
    expect(within(hall).getByRole("link", {name: "See all 6"}).getAttribute("href")).toBe("/seasons");
});
