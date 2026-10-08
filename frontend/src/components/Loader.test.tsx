import {expect, it} from "vitest";
import {render, screen} from "@testing-library/react";
import Loader from "./Loader";

it("announces its label as a status", () => {
    render(<Loader label="Loading matches"/>);
    expect(screen.getByRole("status").textContent).toContain("Loading matches");
});
