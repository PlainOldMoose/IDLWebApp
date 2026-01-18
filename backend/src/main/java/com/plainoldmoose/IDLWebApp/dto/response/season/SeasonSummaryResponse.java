package com.plainoldmoose.IDLWebApp.dto.response.season;

import java.time.LocalDate;

public record SeasonSummaryResponse(String name, String status, LocalDate startDate, LocalDate endDate) {
}
