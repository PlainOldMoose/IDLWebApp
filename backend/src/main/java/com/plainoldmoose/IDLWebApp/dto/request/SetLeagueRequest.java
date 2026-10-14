package com.plainoldmoose.IDLWebApp.dto.request;

import jakarta.validation.constraints.Positive;

// The season's Dota league ticket ID; null takes it off
public record SetLeagueRequest(@Positive Long leagueId) {
}
