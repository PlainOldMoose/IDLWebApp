package com.plainoldmoose.IDLWebApp.dto.response;

public record PlayerSummaryResponse(String username, Long elo, String steamId) {
}
