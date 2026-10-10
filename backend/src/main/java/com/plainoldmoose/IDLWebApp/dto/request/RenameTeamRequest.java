package com.plainoldmoose.IDLWebApp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RenameTeamRequest(
        @NotBlank(message = "Team name is required")
        @Size(max = 32, message = "Team name must be at most 32 characters")
        // No invisible characters, so a name can't look empty or flip its text to pass as another team's
        @Pattern(regexp = "[^\\p{C}]*", message = "Team name can't contain invisible characters")
        String name) {
}
