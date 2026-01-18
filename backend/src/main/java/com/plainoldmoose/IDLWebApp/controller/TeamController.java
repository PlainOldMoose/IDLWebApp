package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.dto.response.team.TeamResponse;
import com.plainoldmoose.IDLWebApp.service.TeamService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/seasons/{seasonId}/teams")
public class TeamController {
    private final TeamService teamService;

    @GetMapping
    public List<TeamResponse> getAllTeams(@PathVariable UUID seasonId) {
        return teamService.getAllTeamsBySeason(seasonId);
    }
}
