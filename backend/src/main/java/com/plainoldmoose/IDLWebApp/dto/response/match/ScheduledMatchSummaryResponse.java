package com.plainoldmoose.IDLWebApp.dto.response.match;

import java.time.LocalDateTime;

public record ScheduledMatchSummaryResponse(
        Long id,
        String teamA,
        String teamB,
        LocalDateTime scheduledTime) {
}
