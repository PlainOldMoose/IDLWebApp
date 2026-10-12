package com.plainoldmoose.IDLWebApp.dto.response.draft;

public record DraftPlayerResponse(
        String steamId,
        String username,
        double elo,
        int draftScore,
        String rolePreference,
        boolean willingToCaptain
) {
}
