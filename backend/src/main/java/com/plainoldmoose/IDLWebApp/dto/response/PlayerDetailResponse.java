package com.plainoldmoose.IDLWebApp.dto.response;

import com.plainoldmoose.IDLWebApp.model.EloHistory;
import com.plainoldmoose.IDLWebApp.model.MatchParticipant;
import com.plainoldmoose.IDLWebApp.model.TeamPlayer;
import jakarta.annotation.Nullable;

import java.time.LocalDateTime;
import java.util.List;

public record PlayerDetailResponse(
        Long id,
        String username,
        Long elo,
        String steamId,
        LocalDateTime createdAt,
        // TODO - Refactor next 3 lines to use DTOs instead of entities
        @Nullable List<EloHistory> eloHistory,
        @Nullable List<MatchParticipant> matchParticipations,
        @Nullable List<TeamPlayer> teamMemberships
) {
}