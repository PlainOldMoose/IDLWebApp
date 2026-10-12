package com.plainoldmoose.IDLWebApp.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;

import java.util.regex.Pattern;

public record SeasonSignupRequest(
        // Dota roles 1-5 joined by / (equal) or > (prefer, more > for stronger), e.g. "1 > 2 > 3/4", or "any" in any case.
        // The sign-up form uses the same format and length.
        // The format allows any run of > and spaces, so the size cap keeps it inside the column
        // Dedicated subs don't give one
        @Size(max = 32, message = "Role preference must be at most 32 characters")
        String rolePreference,
        boolean willingToCaptain,
        boolean sub) {

    // Possessive quantifiers never backtrack, so even an oversized value is rejected in linear time
    private static final Pattern ROLES = Pattern.compile("\\s*+[1-5](?:\\s*+(?:/|>++)\\s*+[1-5])*+\\s*+");

    @AssertTrue(message = "Role preference is required")
    public boolean isRolePreferencePresent() {
        return sub || rolePreference != null;
    }

    // A missing value is reported by isRolePreferencePresent, not here
    @AssertTrue(message = "Role preference must look like 1 >>> 2 > 3/4, or just \"any\"")
    public boolean isRolePreferenceValid() {
        if (rolePreference == null || rolePreference.trim().equalsIgnoreCase("any")) return true;
        if (!ROLES.matcher(rolePreference).matches()) return false;
        // Once the pattern matches, the only digits are roles, and each may be listed once
        String roles = rolePreference.replaceAll("\\D", "");
        return roles.chars().distinct().count() == roles.length();
    }
}
