package com.plainoldmoose.IDLWebApp.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.plainoldmoose.IDLWebApp.dto.request.CreateForfeitRequest;
import com.plainoldmoose.IDLWebApp.dto.request.CreateMatchRequest;
import com.plainoldmoose.IDLWebApp.dto.response.match.BinMatchResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.MatchDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.MatchSummaryResponse;
import com.plainoldmoose.IDLWebApp.service.MatchService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/matches")
public class MatchController {
    private final MatchService matchService;

    @GetMapping
    public List<MatchSummaryResponse> getAllMatches(@RequestParam(required = false) UUID seasonId,
                                                    @RequestParam(required = false) Integer limit) {
        return matchService.getAllMatches(seasonId, limit);
    }

    // A season's "Recently deleted" bin. Admin-only, by SecurityConfig
    @GetMapping("/bin")
    public List<BinMatchResponse> getBin(@RequestParam UUID seasonId) {
        return matchService.getBin(seasonId);
    }

    @PostMapping("/{matchId}/restore")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void restoreMatch(@PathVariable Long matchId) {
        matchService.restore(matchId);
    }

    @GetMapping("/{matchId}")
    public MatchDetailResponse getMatch(@PathVariable Long matchId) {
        return matchService.getMatch(matchId);
    }

    // Writes fall under SecurityConfig's admin-only rule for /api/**
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void createMatch(@Valid @RequestBody CreateMatchRequest request) {
        matchService.create(request);
    }

    @PostMapping("/forfeits")
    @ResponseStatus(HttpStatus.CREATED)
    public void createForfeit(@Valid @RequestBody CreateForfeitRequest request) {
        matchService.createForfeit(request);
    }

    @DeleteMapping("/{matchId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMatch(@PathVariable Long matchId) {
        matchService.delete(matchId);
    }
}
