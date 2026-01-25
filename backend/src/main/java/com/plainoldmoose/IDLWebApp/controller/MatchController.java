package com.plainoldmoose.IDLWebApp.controller;

<<<<<<< HEAD
import com.plainoldmoose.IDLWebApp.dto.response.match.MatchSummaryResponse;
import com.plainoldmoose.IDLWebApp.service.MatchService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
=======
import com.plainoldmoose.IDLWebApp.dto.response.match.MatchDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.MatchSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.UpcomingMatchResponse;
import com.plainoldmoose.IDLWebApp.service.MatchService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
>>>>>>> 4e8cb82 (WIP)

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/matches")
public class MatchController {
    private final MatchService matchService;

    @GetMapping
<<<<<<< HEAD
    public List<MatchSummaryResponse> getAllMatches() {
        return matchService.getAllMatches();
=======
    public List<MatchSummaryResponse> getAllMatches(
            @RequestParam(required = false) UUID seasonId,
            @RequestParam(required = false) UUID teamId,
            @RequestParam(required = false) String playerSteamId) {
        return matchService.getAllMatches(seasonId, teamId, playerSteamId);
    }

    @GetMapping("/upcoming")
    public List<UpcomingMatchResponse> getUpcomingMatches(
            @RequestParam(defaultValue = "5") int limit) {
        return matchService.getUpcomingMatches(limit);
    }

    @GetMapping("/{matchId}")
    public MatchDetailResponse getMatchDetails(@PathVariable("matchId") Long matchId) {
        return matchService.getMatchById(matchId);
>>>>>>> 4e8cb82 (WIP)
    }
}
