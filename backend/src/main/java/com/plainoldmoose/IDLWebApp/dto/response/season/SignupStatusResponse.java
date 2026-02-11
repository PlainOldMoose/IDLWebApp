package com.plainoldmoose.IDLWebApp.dto.response.season;

public record SignupStatusResponse(
        long totalSignups,
        long captainVolunteersCount,
        long captainsNeeded
) {
}
