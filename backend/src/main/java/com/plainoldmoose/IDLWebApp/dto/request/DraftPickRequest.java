package com.plainoldmoose.IDLWebApp.dto.request;

import jakarta.validation.constraints.NotBlank;

public record DraftPickRequest(
        @NotBlank(message = "Pick a player")
        String steamId) {
}
