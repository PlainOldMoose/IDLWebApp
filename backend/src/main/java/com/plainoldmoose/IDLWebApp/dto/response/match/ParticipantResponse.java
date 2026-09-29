package com.plainoldmoose.IDLWebApp.dto.response.match;

import com.plainoldmoose.IDLWebApp.model.enums.Side;

public record ParticipantResponse(
        String steamId,
        String username,
        double eloAtMatchTime,
        Side side,
        double eloChange,
        boolean isSub,
        String subbingForSteamId,
        String subbingForUsername
) {
}
