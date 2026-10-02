package com.plainoldmoose.IDLWebApp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

// Steam IDs of each team; the service checks they're 10 different registered players
public record CreateInhouseRequest(
        @NotNull @Size(min = 5, max = 5, message = "Team A needs 5 players")
        List<@NotBlank String> teamA,
        @NotNull @Size(min = 5, max = 5, message = "Team B needs 5 players")
        List<@NotBlank String> teamB) {
}
