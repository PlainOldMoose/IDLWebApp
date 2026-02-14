package com.plainoldmoose.IDLWebApp.dto.response.team;

import java.util.List;

public record TeamSummaryResponse(
        String name,
        String captainUsername,
        List<TeamMemberResponse> members
) {
}
