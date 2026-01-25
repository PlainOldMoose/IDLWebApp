package com.plainoldmoose.IDLWebApp.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreatePlayerRequest(
        @NotBlank(message = "Username is required")
        String username,

        @Min(0)
        int elo,

        @NotBlank(message = "Steam ID is required")
        @Pattern(regexp = "\\d{17}", message = "Invalid Steam ID format, please use SteamID64")
        String steamId) {
}
