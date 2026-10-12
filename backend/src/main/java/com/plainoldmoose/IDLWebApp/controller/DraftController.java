package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.dto.request.DraftPickRequest;
import com.plainoldmoose.IDLWebApp.dto.request.RenameTeamRequest;
import com.plainoldmoose.IDLWebApp.dto.response.draft.DraftResponse;
import com.plainoldmoose.IDLWebApp.service.DraftService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/seasons/{seasonId}/draft")
public class DraftController {

    private final DraftService draftService;

    // Closes sign-ups and picks the captains. SecurityConfig keeps this and the captain changes admin-only
    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void closeSignups(@PathVariable UUID seasonId) {
        draftService.closeSignups(seasonId);
    }

    @GetMapping
    public DraftResponse getDraft(@PathVariable UUID seasonId) {
        return draftService.getDraft(seasonId);
    }

    @PutMapping("/captains/{steamId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void makeCaptain(@PathVariable UUID seasonId, @PathVariable String steamId) {
        draftService.makeCaptain(seasonId, steamId);
    }

    @DeleteMapping("/captains/{steamId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeCaptain(@PathVariable UUID seasonId, @PathVariable String steamId) {
        draftService.removeCaptain(seasonId, steamId);
    }

    // Once every team is full. Admin-only, like closing sign-ups
    @PostMapping("/start")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void startSeason(@PathVariable UUID seasonId) {
        draftService.startSeason(seasonId);
    }

    // SecurityConfig only lets signed-in players through to picks and renames, so getRemoteUser() is never null.
    // DraftService checks it's the right captain or an admin
    @PostMapping("/picks")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void pick(@PathVariable UUID seasonId, @Valid @RequestBody DraftPickRequest body, HttpServletRequest request) {
        draftService.pick(seasonId, body.steamId(), request.getRemoteUser(), request.isUserInRole("ADMIN"));
    }

    @PutMapping("/teams/{teamId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void renameTeam(@PathVariable UUID seasonId, @PathVariable UUID teamId, @Valid @RequestBody RenameTeamRequest body,
                           HttpServletRequest request) {
        draftService.renameTeam(seasonId, teamId, body.name(), request.getRemoteUser(), request.isUserInRole("ADMIN"));
    }
}
