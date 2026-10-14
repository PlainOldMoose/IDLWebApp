import {expect, it} from "vitest";
import {render, screen, within} from "@testing-library/react";
import Rules from "./Rules";

const renderRules = () => render(<Rules/>);

it("titles the page Rules", () => {
    renderRules();

    expect(screen.getByRole("heading", {level: 1, name: "Rules"})).toBeTruthy();
});

it("lists a jump link for every section, each pointing at that section", () => {
    const {container} = renderRules();

    const contents = screen.getByRole("navigation", {name: "Contents"});
    const links = within(contents).getAllByRole("link");
    expect(links.map(link => link.textContent)).toEqual([
        "0 Wheaton's Law", "1 Season Format", "2 Signups", "3 Prior time commitments", "4 Player draft",
        "5 Reschedules and Subs", "6 Gameplay, drafting, pauses and conceding", "7 Sportsmanship", "8 Penalties",
        "9 Tiebreakers", "10 Admin Discretion",
    ]);
    for (const link of links) {
        const id = link.getAttribute("href")!.replace(/^#/, "");
        const section = container.querySelector(`[id="${id}"]`);
        expect(section, `#${id}`).toBeTruthy();
        expect(within(section as HTMLElement).getByRole("heading", {level: 2}).textContent).toBe(link.textContent);
    }
});

it("links the section 8.2 cross-reference to the Penalties section", () => {
    renderRules();

    const penaltiesHref = within(screen.getByRole("navigation", {name: "Contents"}))
        .getByRole("link", {name: "8 Penalties"}).getAttribute("href");
    expect(screen.getByRole("link", {name: "section 8.2"}).getAttribute("href")).toBe(penaltiesHref);
});
