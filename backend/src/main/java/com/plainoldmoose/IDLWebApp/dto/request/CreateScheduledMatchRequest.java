package com.plainoldmoose.IDLWebApp.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

public record CreateScheduledMatchRequest(
        @NotNull
        UUID teamAId,

        @NotNull
        UUID teamBId,

        @NotNull
        LocalDateTime scheduledTime) {
}
