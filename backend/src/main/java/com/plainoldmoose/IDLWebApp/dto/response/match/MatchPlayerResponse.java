package com.plainoldmoose.IDLWebApp.dto.response.match;

import com.plainoldmoose.IDLWebApp.model.enums.Side;

public record MatchPlayerResponse(
        String steamId,
        String username,
        Side side,
        boolean sub,
        String subbingFor, // username of the player they stood in for, null when not a sub
        Double eloBefore, // null when no ELO history row is linked to the match
        Double eloChange) {
}
