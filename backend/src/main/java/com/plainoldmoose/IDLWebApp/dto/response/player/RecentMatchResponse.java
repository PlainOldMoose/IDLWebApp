package com.plainoldmoose.IDLWebApp.dto.response.player;

import com.plainoldmoose.IDLWebApp.model.enums.Side;

import java.time.LocalDateTime;

public record RecentMatchResponse(
        Long matchId,
        LocalDateTime timePlayed,
        boolean won,
        Side side,
        boolean sub,
        Double eloChange, // null when no ELO history row is linked to the match
        String seasonName
) {
}
