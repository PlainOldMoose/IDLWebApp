package com.plainoldmoose.IDLWebApp.dto.response.team;

import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;

import java.util.List;
import java.util.UUID;

public record TeamResponse(
        UUID teamId,
        String name,
        String captainUsername,
        List<PlayerSummaryResponse> members,
        int avgElo,
        int wins,
        int losses
) {
}
