package com.plainoldmoose.IDLWebApp.dto.response.match;

import com.plainoldmoose.IDLWebApp.model.enums.Side;

import java.time.LocalDateTime;

// A match in a season's "Recently deleted" bin. purgeAt is when it's cleared for good
public record BinMatchResponse(
        Long matchId,
        String radiantTeamName,
        String direTeamName,
        Side winner,
        LocalDateTime deletedAt,
        LocalDateTime purgeAt) {
}
