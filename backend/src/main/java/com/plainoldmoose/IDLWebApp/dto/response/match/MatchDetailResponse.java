package com.plainoldmoose.IDLWebApp.dto.response.match;

import com.plainoldmoose.IDLWebApp.model.enums.Side;

import java.time.LocalDateTime;
import java.util.List;

public record MatchDetailResponse(
        Long matchId,
        Side winner,
        LocalDateTime timePlayed,
        LocalDateTime scheduledTime,
        int avgElo,
        String seasonName,
        String radiantTeamName,
        String direTeamName,
        List<ParticipantResponse> participants) {
}
