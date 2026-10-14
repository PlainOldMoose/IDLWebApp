import {expect, it, vi} from "vitest";
import {render, screen} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {MemoryRouter} from "react-router";
import Landing from "./Landing";

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
