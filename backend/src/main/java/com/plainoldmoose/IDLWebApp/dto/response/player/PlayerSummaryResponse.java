package com.plainoldmoose.IDLWebApp.dto.response.player;

public record PlayerSummaryResponse(
        String username,
        double elo,
        String steamId) {
}
