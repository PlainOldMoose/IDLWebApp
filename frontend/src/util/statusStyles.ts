import type {Season} from "../types/Season.ts";

type SeasonStatus = Season["status"];

export const statusLabels: Record<SeasonStatus, string> = {
    REGISTRATION: "Sign-ups open",
    ACTIVE: "In progress",
    COMPLETED: "Finished",
};

// Text colour for the status label
export const statusTextStyles: Record<SeasonStatus, string> = {
    REGISTRATION: "text-accent",
    ACTIVE: "text-bone",
    COMPLETED: "text-ash",
};

// Node on the seasons timeline: filled while a season still needs players or is being played
export const statusNodeStyles: Record<SeasonStatus, string> = {
    REGISTRATION: "bg-accent border-accent",
    ACTIVE: "bg-bone border-bone",
    COMPLETED: "bg-night border-ash",
};
