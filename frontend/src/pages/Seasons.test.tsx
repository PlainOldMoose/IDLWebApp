import {expect, it, vi} from "vitest";
import {render, screen} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter} from "react-router";
import Seasons from "./Seasons";
import type {Season} from "../types.ts";

const season = (name: string): Season => ({id: name, name, startDate: "2021-01-01", endDate: "2021-03-01", status: "COMPLETED"});

it("marks seasons before Season 25 as legacy", async () => {
    vi.stubGlobal("fetch", vi.fn(async (path: string) => path === "/auth/me"
        ? new Response(null, {status: 401})
        : new Response(JSON.stringify([season("Season 25"), season("Season 24")]))));
    render(
        <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
            <MemoryRouter><Seasons/></MemoryRouter>
        </QueryClientProvider>
    );

    expect((await screen.findByRole("link", {name: /Season 24/})).textContent).toMatch(/Legacy/);
    expect(screen.getByRole("link", {name: /Season 25/}).textContent).not.toMatch(/Legacy/);
});

// Behaviour 7
it("shows the champions on a finished season's card", async () => {
    vi.stubGlobal("fetch", vi.fn(async (path: string) => path === "/auth/me"
        ? new Response(null, {status: 401})
        : new Response(JSON.stringify([{...season("Season 44"), winnerTeamName: "Commando Elite", winnerPlayers: ["Antab"]}, season("Season 45")]))));
    render(
        <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
            <MemoryRouter><Seasons/></MemoryRouter>
        </QueryClientProvider>
    );

    expect((await screen.findByRole("link", {name: /Season 44/})).textContent).toMatch(/Champions\s*Commando Elite/);
    expect(screen.getByRole("link", {name: /Season 45/}).textContent).not.toMatch(/Champions/);
});
