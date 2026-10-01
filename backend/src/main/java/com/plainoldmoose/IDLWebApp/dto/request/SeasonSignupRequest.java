package com.plainoldmoose.IDLWebApp.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SeasonSignupRequest(
        // Dota roles 1-5 joined by / (equal) or > (prefer, more > for stronger), e.g. "1 > 2 > 3/4", or "any" in any case.
        // The lookahead rejects any role listed twice. The sign-up form uses the same pattern and length.
        // The pattern allows any run of > and spaces, so the size cap keeps it inside the column
        @NotNull(message = "Role preference is required")
        @Size(max = 32, message = "Role preference must be at most 32 characters")
        @Pattern(regexp = "^(?:\\s*[Aa][Nn][Yy]\\s*|(?!.*([1-5]).*\\1)\\s*[1-5](\\s*(/|>+)\\s*[1-5])*\\s*)$",
                message = "Role preference must look like 1 >>> 2 > 3/4, or just \"any\"")
        String rolePreference,
        boolean willingToCaptain) {
}
