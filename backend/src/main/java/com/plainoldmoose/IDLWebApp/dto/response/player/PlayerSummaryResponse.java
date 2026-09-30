package com.plainoldmoose.IDLWebApp.dto.response.player;

import com.plainoldmoose.IDLWebApp.model.player.Player;

public record PlayerSummaryResponse(
        String username,
        double elo,
        String steamId) {

    public static PlayerSummaryResponse from(Player player) {
        return new PlayerSummaryResponse(player.getUsername(), player.getElo(), player.getSteamId());
    }
}
