package com.plainoldmoose.IDLWebApp.dto.response.player;

public record PlayerSummaryResponse(String username, Long elo, String steamId) {
}
