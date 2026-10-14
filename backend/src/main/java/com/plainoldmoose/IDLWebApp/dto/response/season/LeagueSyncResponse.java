package com.plainoldmoose.IDLWebApp.dto.response.season;

import java.time.LocalDateTime;
import java.util.List;

// The admin's view of a season's league sync: how the last run went and what's waiting to be checked
public record LeagueSyncResponse(LocalDateTime syncedAt, String error, List<PendingMatchResponse> pending) {
}
