import {expect, it} from "vitest";
import {render, screen, within} from "@testing-library/react";
import {MemoryRouter} from "react-router";
import MatchSummaryCard from "./MatchSummaryCard";
import type {MatchSummary} from "../types";

const match: MatchSummary = {
    matchId: 1234, winner: "RADIANT", timePlayed: "2026-10-01T19:00:00", avgElo: 1523,
    seasonId: "s1", seasonName: "Season 41", radiantTeamName: "Sporky Diver", direTeamName: "The Bad Guys", forfeit: false,
};

const renderCard = (summary: MatchSummary) => render(<MemoryRouter><MatchSummaryCard match={summary}/></MemoryRouter>);

it("shows the match's average ELO when it's recorded", () => {
    renderCard(match);

    expect(screen.getByRole("link").textContent).toContain("1,523 avg ELO");
});

it("shows a dash when the average ELO isn't recorded", () => {
    renderCard({...match, avgElo: null});

    const link = screen.getByRole("link");
    expect(screen.getByText("–")).toBeTruthy();
    expect(link.textContent).toContain("No avg ELO");
    expect(link.textContent).not.toMatch(/\d avg ELO/);
});

// Forfeit behaviour 10
it("says Forfeit where a forfeit's average ELO would go", () => {
    renderCard({...match, avgElo: null, forfeit: true});

    const link = screen.getByRole("link");
    expect(within(link).getByText("Forfeit")).toBeTruthy();
    expect(link.textContent).not.toContain("avg");
});
