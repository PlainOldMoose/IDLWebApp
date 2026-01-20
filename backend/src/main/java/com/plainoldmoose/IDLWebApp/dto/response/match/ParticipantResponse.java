package com.plainoldmoose.IDLWebApp.dto.response.match;

import com.plainoldmoose.IDLWebApp.model.enums.Side;

public record ParticipantResponse(
        String steamId,
        String username,
        int currentElo,
        Side side,
        int eloChange,
        boolean isSub,
        String subbingForSteamId,
        String subbingForUsername
) {
}
