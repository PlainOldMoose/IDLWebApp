package com.plainoldmoose.IDLWebApp.dto.response.match;

// Where a team stood in its season going into a match
public record TeamStandingResponse(
        int position, // 1 for first
        int teamCount,
        int wins,
        int losses) {
}
