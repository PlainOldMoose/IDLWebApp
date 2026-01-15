package com.plainoldmoose.IDLWebApp.dto.request;

public record CreatePlayerRequest(String username, Long elo, String steamId) {
}
