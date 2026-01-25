import type { PlayerListColumn } from "./PlayerListTypes";
import type { PlayerSummary } from "../../types/player/PlayerDetail";

export function usernameColumn<T extends PlayerSummary>(): PlayerListColumn<T> {
  return {
    key: "username",
    header: "Player",
    render: (player) => player.username,
  };
}

export function eloColumn<T extends PlayerSummary>(): PlayerListColumn<T> {
  return {
    key: "elo",
    header: "Elo",
    align: "end",
    render: (player) => player.elo,
  };
}
