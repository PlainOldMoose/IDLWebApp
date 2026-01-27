package com.plainoldmoose.IDLWebApp.dto.response.player;

import com.plainoldmoose.IDLWebApp.model.player.EloSnapshot;

import java.util.List;

public record PlayerDetailResponse(
        String steamId,
        String username,
        int elo,
        int matchesPlayed,
        int wins,
        int losses,
        double winRate,
        List<RecentMatchResponse> recentMatches,// Last 20 matches
        List<EloSnapshot> eloSnapshotHistory
) {
}