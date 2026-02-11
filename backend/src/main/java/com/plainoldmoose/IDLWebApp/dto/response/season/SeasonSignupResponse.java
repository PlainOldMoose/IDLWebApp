package com.plainoldmoose.IDLWebApp.dto.response.season;

public record SeasonSignupResponse(
        String steamId,
        String username,
        boolean willingToCaptain
) {
}
