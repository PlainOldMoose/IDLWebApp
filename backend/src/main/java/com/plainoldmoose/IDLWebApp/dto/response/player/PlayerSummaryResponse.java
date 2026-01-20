package com.plainoldmoose.IDLWebApp.dto.response.player;

public record PlayerSummaryResponse(
        String username,
        int elo,
        String steamId) {
}
