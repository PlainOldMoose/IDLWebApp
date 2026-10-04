package com.plainoldmoose.IDLWebApp.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CompleteSeasonRequest(@NotNull UUID winnerTeamId) {
}
