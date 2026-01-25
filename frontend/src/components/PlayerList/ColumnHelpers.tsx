import type { PlayerListColumn } from "./PlayerListTypes";
<<<<<<< HEAD
import type { PlayerSummary } from "../../types/Player";
=======
import type { PlayerSummary } from "../../types/player/PlayerDetail";
>>>>>>> 4e8cb82 (WIP)

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
