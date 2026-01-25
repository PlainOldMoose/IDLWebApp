package com.plainoldmoose.IDLWebApp.dto.response.match;

import java.time.LocalDateTime;

public record UpcomingMatchResponse(
        Long matchId,
        LocalDateTime scheduledTime,
        String seasonName,
        String radiantTeamName,
        String direTeamName,
        int radiantTeamAvgElo,
        int direTeamAvgElo
) {
}
