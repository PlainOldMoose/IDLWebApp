package com.plainoldmoose.IDLWebApp.dto.response.season;

import com.plainoldmoose.IDLWebApp.dto.response.team.TeamResponse;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record SeasonDetailResponse(
        String name,
        UUID id,
        SeasonStatus status,
        LocalDate startDate,
        LocalDate endDate,
        List<TeamResponse> teams) {
}
