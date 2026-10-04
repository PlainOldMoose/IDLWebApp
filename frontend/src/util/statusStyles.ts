import type {Season} from "../types.ts";

// The status label, its text colour, and its node on the seasons timeline: filled while a season still needs players or is being played
export const statusStyles: Record<Season["status"], { label: string, text: string, node: string }> = {
    REGISTRATION: {label: "Sign-ups open", text: "text-accent", node: "bg-accent border-accent"},
    ACTIVE: {label: "In progress", text: "text-live", node: "bg-live border-live"},
    COMPLETED: {label: "Finished", text: "text-rosewood", node: "bg-night border-rosewood"},
};
