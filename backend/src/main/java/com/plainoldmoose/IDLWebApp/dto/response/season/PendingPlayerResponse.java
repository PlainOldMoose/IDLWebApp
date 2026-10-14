package com.plainoldmoose.IDLWebApp.dto.response.season;

// username is null when the Steam account isn't a registered player
public record PendingPlayerResponse(String steamId, String username) {
}
