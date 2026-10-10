import {beforeEach, expect, it, vi} from "vitest";
import {render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter, Route, Routes} from "react-router";
import SeasonDetail from "./SeasonDetail";
import type {SeasonDetail as SeasonDetailData, SeasonSignup, SteamUser} from "../types.ts";

const signup = (steamId: string, sub = false): SeasonSignup => ({
    steamId, username: steamId, rolePreference: sub ? null : "any", willingToCaptain: false, signedUpAt: "2026-01-01T12:00", sub,
});

let posted: unknown;
let postedTo: string | undefined;

function renderSeason({status = "REGISTRATION", signups, user = null}: {
    status?: SeasonDetailData["status"], signups: SeasonSignup[], user?: SteamUser | null
}) {
    const season: SeasonDetailData = {id: "s1", name: "Season 5", startDate: "2026-02-01", endDate: "2026-03-01", status, teams: []};
    vi.stubGlobal("fetch", vi.fn(async (path: string, init?: RequestInit) => {
        if (init?.method === "POST") {
            postedTo = path;
            posted = init.body ? JSON.parse(String(init.body)) : undefined;
        }
        const body = path === "/auth/me" ? user
            : path === "/api/seasons/s1" ? season
            : path === "/api/seasons/s1/signups" ? signups
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

const panel = async (title: string) => (await screen.findByRole("heading", {name: title})).closest("section")!;

beforeEach(() => {
    posted = undefined;
    postedTo = undefined;
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
