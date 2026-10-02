package com.plainoldmoose.IDLWebApp.dto.response.inhouse;

import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.enums.Side;

import java.time.LocalDateTime;
import java.util.List;

public record InhouseResponse(
        Long id, // null for a balance option nobody has picked yet
        LocalDateTime createdAt, // null with id
        List<PlayerSummaryResponse> radiant, // Highest ELO first
        List<PlayerSummaryResponse> dire,
        Side reportedWinner, // null until someone reports the result; only the admin queue has these
        String reportedBy) { // the reporter's username
}
