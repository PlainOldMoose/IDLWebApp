package com.plainoldmoose.IDLWebApp.dto.response.inhouse;

import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.enums.Side;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record InhouseResponse(
        Long id, // null for a balance option nobody has picked yet
        LocalDateTime createdAt, // null with id
        List<PlayerSummaryResponse> teamA, // Highest ELO first
        List<PlayerSummaryResponse> teamB,
        Side reportedWinner, // null until someone reports the result; only the admin queue has these
        Side teamASide, // the side Team A played, reported with the result
        String reportedBy, // the reporter's username
        Map<String, Double> eloChanges) { // Steam ID to what approving the result would do to their ELO; only the admin queue has these
}
