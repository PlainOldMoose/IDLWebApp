package com.plainoldmoose.IDLWebApp.dto.response.inhouse;

import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;

import java.time.LocalDateTime;
import java.util.List;

public record InhouseResponse(
        Long id, // null for a balance option nobody has picked yet
        LocalDateTime createdAt, // null with id
        List<PlayerSummaryResponse> radiant, // Highest ELO first
        List<PlayerSummaryResponse> dire) {
}
