import {expect, it, vi} from "vitest";
import {render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter, Route, Routes, useLocation} from "react-router";
import Players from "./Players";
import type {PlayerSummary} from "../types.ts";

const player = (username: string, elo: number, disabled = false): PlayerSummary =>
    ({steamId: username, username, elo, disabled});
// Highest ELO first, as the API returns them
const active = [player("Alpha", 1800), player("Bravo", 1600)];
const withDisabled = [active[0], player("Xray", 1700, true), active[1]];

function Search() {
    return <output aria-label="Search">{useLocation().search}</output>;
}

function renderPlayers({admin = false, search = ""} = {}) {
    vi.stubGlobal("fetch", vi.fn(async (path: string) => {
        if (path === "/api/players") return new Response(JSON.stringify(active));
        if (path === "/api/players?includeDisabled=true") return new Response(JSON.stringify(withDisabled));
        if (path === "/auth/me") return admin
            ? new Response(JSON.stringify({steamId: "admin", username: "Admin", admin: true}))
            : new Response(null, {status: 401});
        return new Response(null, {status: 404});
    }));
    render(
        <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
            <MemoryRouter initialEntries={[`/players${search}`]}>
                <Routes><Route path="/players" element={<><Players/><Search/></>}/></Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );
}

const rankingRows = async () => {
    const rankings = await screen.findByRole("region", {name: "Rankings"});
    return within(rankings).getAllByRole("listitem").map(row => row.textContent);
};

// Disabled behaviour 16
it("offers admins a Show disabled toggle", async () => {
    renderPlayers({admin: true});

    expect(await screen.findByRole("checkbox", {name: "Show disabled"})).toBeTruthy();
});

it("doesn't offer players the toggle", async () => {
    renderPlayers();

    await rankingRows();
    expect(screen.queryByRole("checkbox", {name: "Show disabled"})).toBeNull();
});

// Disabled behaviour 17
it("lists disabled players unranked when toggled, and keeps it in the URL", async () => {
    renderPlayers({admin: true});

    await userEvent.click(await screen.findByRole("checkbox", {name: "Show disabled"}));

    expect(screen.getByRole("status", {name: "Search"}).textContent).toBe("?disabled=1");
    await screen.findByText("Xray");
    const rows = await rankingRows();
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatch(/^1Alpha/);
    expect(rows[1]).toMatch(/^Xray/);
    expect(rows[1]).toMatch(/Disabled/);
    // Ranks skip the disabled player
    expect(rows[2]).toMatch(/^2Bravo/);
});

it("leaves disabled players out by default", async () => {
    renderPlayers({admin: true});

    const rows = await rankingRows();
    expect(rows).toHaveLength(2);
    expect(screen.queryByText("Xray")).toBeNull();
});

// Disabled behaviour 18
it("keeps disabled players out of the league stats", async () => {
    renderPlayers({admin: true, search: "?disabled=1"});

    await screen.findByText("Xray");
    const league = screen.getByRole("region", {name: "League"});
    // StatStrip pairs each label (dt) with its figure (dd)
    expect(within(league).getByText("Players").nextElementSibling?.textContent).toBe("2");
});
