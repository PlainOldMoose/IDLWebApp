package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.dto.request.SeasonSignupRequest;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSignupResponse;
import com.plainoldmoose.IDLWebApp.service.SeasonSignupService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/seasons/{seasonId}/signups")
public class SeasonSignupController {

    private final SeasonSignupService seasonSignupService;

    // SecurityConfig only lets signed-in players through, so principal is never null
    @PostMapping
    public SeasonSignupResponse signup(@PathVariable UUID seasonId, @Valid @RequestBody SeasonSignupRequest request, Principal principal) {
        return seasonSignupService.signup(seasonId, principal.getName(), request.rolePreference(), request.willingToCaptain(), request.sub());
    }

    // Only ever the caller's own sign-up
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void withdraw(@PathVariable UUID seasonId, Principal principal) {
        seasonSignupService.withdraw(seasonId, principal.getName());
    }

    @GetMapping
    public List<SeasonSignupResponse> getSignups(@PathVariable UUID seasonId) {
        return seasonSignupService.getSignups(seasonId);
    }
}
