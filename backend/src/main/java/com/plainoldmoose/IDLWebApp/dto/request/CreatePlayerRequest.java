package com.plainoldmoose.IDLWebApp.dto.request;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreatePlayerRequest(
        @NotBlank(message = "Username is required")
        @Size(max = 64, message = "Username must be at most 64 characters")
        String username,

        @PositiveOrZero
        double elo,

        @NotBlank(message = "Steam ID is required")
        @Pattern(regexp = "\\d{17}", message = "Invalid Steam ID format, please use SteamID64")
        String steamId) {
}
