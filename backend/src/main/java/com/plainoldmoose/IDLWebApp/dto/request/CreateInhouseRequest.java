package com.plainoldmoose.IDLWebApp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

// Steam IDs of each side; the service checks they're 10 different registered players
public record CreateInhouseRequest(
        @NotNull @Size(min = 5, max = 5, message = "Radiant needs 5 players")
        List<@NotBlank String> radiant,
        @NotNull @Size(min = 5, max = 5, message = "Dire needs 5 players")
        List<@NotBlank String> dire) {
}
