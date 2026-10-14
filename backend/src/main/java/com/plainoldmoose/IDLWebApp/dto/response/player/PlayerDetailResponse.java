package com.plainoldmoose.IDLWebApp.dto.response.player;

import java.util.List;

public record PlayerDetailResponse(
        String steamId,
        String username,
        double elo,
        int wins,
        int losses,
        double winRate,
        // NOTE: grows with each match, move paging to the API if a player reaches the thousands
        List<PlayerMatchResponse> matches
) {
}
