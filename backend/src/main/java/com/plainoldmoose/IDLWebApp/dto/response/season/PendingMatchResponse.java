package com.plainoldmoose.IDLWebApp.dto.response.season;

import com.plainoldmoose.IDLWebApp.model.enums.Side;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

// A ticketed game waiting for an admin. The team IDs are the sync's guesses and can be null
public record PendingMatchResponse(
        Long matchId,
        LocalDateTime playedTime,
        Side winner,
        UUID radiantTeamId,
        UUID direTeamId,
        List<PendingPlayerResponse> radiant,
        List<PendingPlayerResponse> dire,
        String reason) {
}
