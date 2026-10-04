package com.plainoldmoose.IDLWebApp.dto.response.match;

import com.plainoldmoose.IDLWebApp.model.enums.Side;

import java.time.LocalDateTime;
import java.util.UUID;

public record MatchSummaryResponse(
        Long matchId,
        Side winner,
        LocalDateTime timePlayed,
        int avgElo,
        UUID seasonId, // null for an in-house
        String seasonName,
        String radiantTeamName,
        String direTeamName) {
}
