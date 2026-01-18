package com.plainoldmoose.IDLWebApp.dto.response.player;

import java.time.LocalDateTime;

public record RecentMatchResponse(
        Long matchId,
        LocalDateTime playedAt,
        boolean won,
        int eloChange,
        String seasonName
) {
}
