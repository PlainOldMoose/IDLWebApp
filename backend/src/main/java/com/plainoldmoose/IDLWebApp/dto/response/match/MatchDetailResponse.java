package com.plainoldmoose.IDLWebApp.dto.response.match;

import java.util.List;

public record MatchDetailResponse(
        MatchSummaryResponse match,
        List<MatchPlayerResponse> players // By ELO going in, highest first
) {
}
