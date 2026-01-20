package com.plainoldmoose.IDLWebApp.dto.response.player;

import java.time.LocalDateTime;

public record RecentMatchResponse(
        Long matchId,
        LocalDateTime timePlayed,
        boolean won,
        int eloChange,
        String seasonName
) {
}
