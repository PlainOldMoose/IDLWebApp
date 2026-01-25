package com.plainoldmoose.IDLWebApp.dto.response.team;

public record TeamMemberResponse(
    String steamId,
    String username,
    int currentElo) {
}
