package com.plainoldmoose.IDLWebApp.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

// A season game one team didn't turn up for. Both teams' rosters are recorded; there's no Dota match, so the ID is made up
public record CreateForfeitRequest(
        @NotNull UUID seasonId,
        @NotNull LocalDateTime playedTime,
        @NotNull UUID forfeitingTeamId,
        @NotNull UUID opponentTeamId) {
}
