package com.plainoldmoose.IDLWebApp.dto.response.draft;

import java.util.List;
import java.util.UUID;

public record DraftTeamResponse(
        UUID teamId,
        String name,
        String captainSteamId,
        List<DraftPlayerResponse> members,
        int draftScore
) {
}
