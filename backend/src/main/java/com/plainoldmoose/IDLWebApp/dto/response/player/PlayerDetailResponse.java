package com.plainoldmoose.IDLWebApp.dto.response;

import com.plainoldmoose.IDLWebApp.model.EloHistory;
import com.plainoldmoose.IDLWebApp.model.MatchParticipant;
import jakarta.annotation.Nullable;

import java.time.LocalDateTime;
import java.util.List;

public record PlayerDetailResponse(
        String steamId,
        String username,
        Long elo,
        int matchesPlayed,
        int wins,
        int losses,
        double winRate,
        List<RecentMatchResponse> recentMatches, // Last 20 matches
        List<EloHistory> eloHistory
) {
}