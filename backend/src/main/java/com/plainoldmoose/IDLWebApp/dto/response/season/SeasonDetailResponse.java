package com.plainoldmoose.IDLWebApp.dto.response;

import com.plainoldmoose.IDLWebApp.model.Team;

import java.time.LocalDate;
import java.util.List;

public record SeasonDetailResponse(String name, String status, LocalDate startDate, LocalDate endDate, List<TeamResponse> teams) {
}
