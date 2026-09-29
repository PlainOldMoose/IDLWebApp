package com.plainoldmoose.IDLWebApp.dto.response.player;

import com.plainoldmoose.IDLWebApp.model.enums.EloChangeReason;

import java.time.LocalDateTime;

public record EloHistoryResponse(
        double elo,
        double eloChange,
        LocalDateTime timestamp,
        EloChangeReason reason,
        Long matchId // Null for INITIAL/MANUAL
) {
}
