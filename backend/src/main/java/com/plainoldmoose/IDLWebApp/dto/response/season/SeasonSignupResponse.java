package com.plainoldmoose.IDLWebApp.dto.response.season;

import java.time.LocalDateTime;

public record SeasonSignupResponse(
        Long id,
        String steamId,
        String username,
        boolean willingToCaptain,
        LocalDateTime signedUpAt
) {
}
