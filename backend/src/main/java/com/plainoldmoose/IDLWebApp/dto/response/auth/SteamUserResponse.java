package com.plainoldmoose.IDLWebApp.dto.response.auth;

import com.fasterxml.jackson.annotation.JsonIgnore;

public record SteamUserResponse(
        String steamId,
        String username,
        boolean admin,
        // Only for sign-in and the per-request check; a disabled player never reaches /auth/me
        @JsonIgnore boolean disabled) {
}
