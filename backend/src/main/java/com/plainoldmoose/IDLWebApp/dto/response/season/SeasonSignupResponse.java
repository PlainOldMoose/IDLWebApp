package com.plainoldmoose.IDLWebApp.dto.response.season;

import java.time.LocalDateTime;

public record SeasonSignupResponse(
        Long id,
        String steamId,
        String username,
        String rolePreference,
        boolean willingToCaptain,
        LocalDateTime signedUpAt
) {
}
