package com.plainoldmoose.IDLWebApp.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record SeasonSignupRequest(
        // Dota roles 1-5 joined by / (equal) or > (prefer, more > for stronger), e.g. "1 > 2 > 3/4".
        // The lookahead rejects any role listed twice. The sign-up form uses the same pattern
        @NotNull(message = "Role preference is required")
        @Pattern(regexp = "^(?!.*([1-5]).*\\1)\\s*[1-5](\\s*(/|>+)\\s*[1-5])*\\s*$",
                message = "Role preference must look like 1 > 2 > 3/4")
        String rolePreference,
        boolean willingToCaptain) {
}
