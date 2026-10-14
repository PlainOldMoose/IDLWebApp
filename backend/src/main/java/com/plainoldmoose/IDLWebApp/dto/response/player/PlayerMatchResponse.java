package com.plainoldmoose.IDLWebApp.dto.response.player;

import com.plainoldmoose.IDLWebApp.model.enums.Side;

import java.time.LocalDateTime;
import java.util.UUID;

public record PlayerMatchResponse(
        Long matchId,
        LocalDateTime timePlayed,
        boolean won,
        Side side,
        boolean sub,
        Double eloChange, // null when no ELO history row is linked to the match
        UUID seasonId, // null for an in-house
        String seasonName
) {
}
