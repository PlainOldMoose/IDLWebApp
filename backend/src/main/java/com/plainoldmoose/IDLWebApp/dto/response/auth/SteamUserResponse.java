package com.plainoldmoose.IDLWebApp.dto.response.auth;

public record SteamUserResponse(
        String steamId,
        String username) {
}
