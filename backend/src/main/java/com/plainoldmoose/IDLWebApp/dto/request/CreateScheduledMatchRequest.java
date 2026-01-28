package com.plainoldmoose.IDLWebApp.dto.request;

import com.plainoldmoose.IDLWebApp.model.Team;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public record CreateScheduledMatchRequest(
        @NotBlank
        Team teamA,

        @NotBlank
        Team teamB,

        @NotBlank
        LocalDateTime scheduledTime) {
}
