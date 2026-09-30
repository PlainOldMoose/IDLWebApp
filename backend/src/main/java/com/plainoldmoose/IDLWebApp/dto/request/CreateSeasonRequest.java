package com.plainoldmoose.IDLWebApp.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateSeasonRequest(
        @NotBlank(message = "Season name is required")
        @Size(max = 64, message = "Season name must be at most 64 characters")
        String name,
        @NotNull(message = "Start date is required")
        LocalDate startDate,
        @NotNull(message = "End date is required")
        LocalDate endDate) {

    // Missing dates are reported by @NotNull, not here
    @AssertTrue(message = "End date can't be before the start date")
    public boolean isEndOnOrAfterStart() {
        return startDate == null || endDate == null || !endDate.isBefore(startDate);
    }
}
