package com.plainoldmoose.IDLWebApp.dto.response.admin;

public record AdminStatsResponse(
        long totalPlayers,
        long totalMatches,
        long totalSeasons,
        long totalTeams
) {}