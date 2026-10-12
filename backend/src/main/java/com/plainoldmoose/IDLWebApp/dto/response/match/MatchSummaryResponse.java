package com.plainoldmoose.IDLWebApp.dto.response.match;

import com.plainoldmoose.IDLWebApp.model.enums.Side;

import java.time.LocalDateTime;
import java.util.UUID;

public record MatchSummaryResponse(
        Long matchId,
        Side winner,
        LocalDateTime timePlayed,
        Integer avgElo, // null unless all 10 players have an ELO record for the match
        UUID seasonId, // null for an in-house
        String seasonName,
        String radiantTeamName,
        String direTeamName) {
}
