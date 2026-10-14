package com.plainoldmoose.IDLWebApp.model.enums;

// Who added a match: the league sync, or an admin by hand (and in-houses). Only synced matches can be found again on
// the ticket, so deleting a manual one means typing it back in
public enum MatchSource {
    API_SYNC, MANUAL
}
