package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.service.TeamService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/teams")
public class TeamController {
    private final TeamService teamService;

//    @GetMapping
//    public List<TeamResponse> getAllTeams() {
//        return teamService.getAllTeams();
//    }
}
