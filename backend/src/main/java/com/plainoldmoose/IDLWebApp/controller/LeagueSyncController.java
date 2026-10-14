package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.dto.request.SetLeagueRequest;
import com.plainoldmoose.IDLWebApp.dto.response.season.LeagueSyncResponse;
import com.plainoldmoose.IDLWebApp.service.MatchSyncService;
import com.plainoldmoose.IDLWebApp.service.SeasonService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

// A season's league ticket and the games synced from it. All admin-only, reads included
@RestController
@AllArgsConstructor
@RequestMapping(path = "api/seasons/{id}/league")
public class LeagueSyncController {
    private final SeasonService seasonService;
    private final MatchSyncService matchSyncService;

    @GetMapping
    public LeagueSyncResponse getLeagueSync(@PathVariable UUID id) {
        return matchSyncService.getLeagueSync(id);
    }

    @PutMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setLeague(@PathVariable UUID id, @Valid @RequestBody SetLeagueRequest request) {
        seasonService.setLeague(id, request.leagueId());
    }

    @PostMapping("/sync")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sync(@PathVariable UUID id) {
        matchSyncService.sync(id);
    }

    @DeleteMapping("/pending/{matchId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@PathVariable UUID id, @PathVariable Long matchId) {
        matchSyncService.reject(id, matchId);
    }
}
