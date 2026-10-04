package com.plainoldmoose.IDLWebApp.dto.request;

import com.plainoldmoose.IDLWebApp.model.enums.Side;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

// A season game the league ticket missed, entered by an admin. The match ID is Dota's. radiant and dire are the Steam IDs
// who played each side; anyone not on that side's team counts as a sub. The service checks the rest against the season
public record CreateMatchRequest(
        @NotNull Long matchId,
        @NotNull UUID seasonId,
        @NotNull LocalDateTime playedTime,
        @NotNull UUID radiantTeamId,
        @NotNull UUID direTeamId,
        @NotNull Side winner,
        @NotNull @Size(min = 5, max = 5, message = "Radiant needs 5 players")
        List<@NotBlank String> radiant,
        @NotNull @Size(min = 5, max = 5, message = "Dire needs 5 players")
        List<@NotBlank String> dire) {
}
