package com.plainoldmoose.IDLWebApp.dto.response.season;

import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record SeasonSummaryResponse(
        String name,
        SeasonStatus status,
        UUID id,
        LocalDate startDate,
        LocalDate endDate,
        String winnerTeamName,
        List<String> winnerPlayers) {
}
