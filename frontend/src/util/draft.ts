import type {DraftTeam} from "../types.ts";

// The name a team is given when its captain is made, so a team with it hasn't been renamed yet
export const hasDefaultName = (team: DraftTeam) =>
    team.name === `${team.members.find(member => member.steamId === team.captainSteamId)?.username}'s team`;
