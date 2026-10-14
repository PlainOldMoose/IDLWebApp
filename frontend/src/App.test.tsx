import {expect, it, vi} from "vitest";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import App from "./App";

it("opens the rules from the nav bar", async () => {
    vi.stubGlobal("fetch", vi.fn(async (path: string) => path === "/auth/me"
        ? new Response(null, {status: 401})
        : new Response(JSON.stringify([]))));
    render(
        <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
            <App/>
        </QueryClientProvider>
    );

    await userEvent.click(screen.getByRole("link", {name: "Rules"}));

    expect(await screen.findByRole("heading", {level: 1, name: "Rules"})).toBeTruthy();
});
