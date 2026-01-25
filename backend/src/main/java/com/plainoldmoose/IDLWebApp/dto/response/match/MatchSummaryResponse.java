package com.plainoldmoose.IDLWebApp.dto.response.match;

import com.plainoldmoose.IDLWebApp.model.enums.Side;

import java.time.LocalDateTime;

public record MatchSummaryResponse(
        Long matchId,
        Side winner,
        LocalDateTime timePlayed,
        int avgElo,
        String seasonName) {
}
