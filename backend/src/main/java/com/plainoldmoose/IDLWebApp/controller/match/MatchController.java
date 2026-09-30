package com.plainoldmoose.IDLWebApp.controller.match;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.plainoldmoose.IDLWebApp.dto.response.match.MatchSummaryResponse;
import com.plainoldmoose.IDLWebApp.service.MatchService;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/matches")
public class MatchController {
    private final MatchService matchService;

    @GetMapping
    public List<MatchSummaryResponse> getAllMatches(@RequestParam(required = false) UUID seasonId) {
        return matchService.getAllMatches(seasonId);
    }
}
