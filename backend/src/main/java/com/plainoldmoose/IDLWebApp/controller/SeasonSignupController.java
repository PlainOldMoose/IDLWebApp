package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.dto.request.SeasonSignupRequest;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSignupResponse;
import com.plainoldmoose.IDLWebApp.service.SeasonSignupService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/seasons/{seasonId}/signups")
public class SeasonSignupController {

    private final SeasonSignupService seasonSignupService;

    @PostMapping
    public ResponseEntity<SeasonSignupResponse> signup(@PathVariable UUID seasonId, @RequestBody SeasonSignupRequest request) {
        String steamId = getAuthenticatedSteamId();
        SeasonSignupResponse response = seasonSignupService.signup(seasonId, steamId, request.willingToCaptain());

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public List<SeasonSignupResponse> getSignups(@PathVariable UUID seasonId) {
        return seasonSignupService.getSignups(seasonId);
    }

    private String getAuthenticatedSteamId() {
        Authentication auth = SecurityContextHolder.getContext()
                .getAuthentication();

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        return (String) auth.getPrincipal();
    }
}
