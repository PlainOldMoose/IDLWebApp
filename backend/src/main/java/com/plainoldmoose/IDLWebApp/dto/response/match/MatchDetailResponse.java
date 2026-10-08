package com.plainoldmoose.IDLWebApp.dto.response.match;

import java.util.List;

public record MatchDetailResponse(
        MatchSummaryResponse match,
        List<MatchPlayerResponse> players, // By ELO going in, highest first
        TeamStandingResponse radiantStanding, // null for an in-house
        TeamStandingResponse direStanding,
        Double radiantWinChance // 0 to 1, from the ELO going in; null unless every player has an ELO record
) {
}
