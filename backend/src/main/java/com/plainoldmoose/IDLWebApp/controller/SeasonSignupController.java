package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.dto.request.SeasonSignupRequest;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSignupResponse;
import com.plainoldmoose.IDLWebApp.service.SeasonSignupService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/seasons/{seasonId}/signups")
public class SeasonSignupController {

    private final SeasonSignupService seasonSignupService;

    // principal is null for anonymous requests
    @PostMapping
    public SeasonSignupResponse signup(@PathVariable UUID seasonId, @RequestBody SeasonSignupRequest request, Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return seasonSignupService.signup(seasonId, principal.getName(), request.willingToCaptain());
    }

    @GetMapping
    public List<SeasonSignupResponse> getSignups(@PathVariable UUID seasonId) {
        return seasonSignupService.getSignups(seasonId);
    }
}
