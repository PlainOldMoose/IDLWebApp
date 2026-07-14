package com.plainoldmoose.IDLWebApp.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record CreateSeasonRequest(
        @NotBlank(message = "Season name is required")
        String name,
        LocalDate startDate,
        LocalDate endDate) {
}
