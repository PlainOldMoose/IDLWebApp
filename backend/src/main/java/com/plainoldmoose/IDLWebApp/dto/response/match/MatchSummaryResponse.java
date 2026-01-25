package com.plainoldmoose.IDLWebApp.dto.response.match;

import com.plainoldmoose.IDLWebApp.model.enums.Side;

import java.time.LocalDateTime;

public record MatchSummaryResponse(
<<<<<<< HEAD
        Long matchId, Side winner,
        LocalDateTime timePlayed,
        Long avgElo) {
=======
        Long matchId,
        Side winner,
        LocalDateTime timePlayed,
        int avgElo,
        String seasonName) {
>>>>>>> 4e8cb82 (WIP)
}
