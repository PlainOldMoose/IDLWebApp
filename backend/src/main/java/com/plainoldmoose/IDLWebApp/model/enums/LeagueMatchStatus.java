package com.plainoldmoose.IDLWebApp.model.enums;

// What the league sync did with a ticketed game. Every game it has seen keeps a row, so a rejected or deleted one
// isn't imported again
public enum LeagueMatchStatus {
    PENDING, IMPORTED, REJECTED,
    // Synced, then deleted by an admin; Add match can still bring it back
    DELETED
}
