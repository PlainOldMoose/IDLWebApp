package com.plainoldmoose.IDLWebApp.dto.response.draft;

import java.util.List;
import java.util.UUID;

public record DraftResponse(
        List<DraftPlayerResponse> pool,
        List<DraftTeamResponse> teams,
        UUID onTheClockTeamId,
        int teamCount
) {
}
