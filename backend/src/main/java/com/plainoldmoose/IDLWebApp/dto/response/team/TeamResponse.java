package com.plainoldmoose.IDLWebApp.dto.response.team;

import java.util.List;
import java.util.UUID;

public record TeamResponse(
        UUID teamId,
        String teamName,
        String captainSteamId,
        String captainUsername,
        List<TeamMemberResponse> members,
        int avgElo,
        int wins,
        int losses,
        double winRate
) {
}
