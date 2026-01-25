package com.plainoldmoose.IDLWebApp.dto.response.season;

import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Represents a Summary Response for a Season Entity.
 *
 * @param name
 * @param status
 * @param id
 * @param startDate
 * @param endDate
 */
public record SeasonSummaryResponse(
        String name,
        SeasonStatus status,
        UUID id,
        LocalDate startDate,
        LocalDate endDate) {
}
