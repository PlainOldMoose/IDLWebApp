package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.dto.response.match.MatchSummaryResponse;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/matches")
public class MatchController {
    private final MatchService matchService;

    @GetMapping
    public List<MatchSummaryResponse> getAllMatches() {
        return matchService.getAllMatches();
    }
}
