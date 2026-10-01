package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.dto.request.CreateInhouseRequest;
import com.plainoldmoose.IDLWebApp.dto.response.inhouse.InhouseResponse;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.service.InhouseService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/inhouses")
public class InhouseController {

    private final InhouseService inhouseService;

    // The 3 most even ways to split 10 players. Saves nothing, so it's open to everyone
    @GetMapping("/balance")
    public List<InhouseResponse> balance(@RequestParam List<String> players) {
        return inhouseService.balanceOptions(players);
    }

    @GetMapping
    public List<InhouseResponse> getInProgress() {
        return inhouseService.getInProgress();
    }

    @PostMapping
    public InhouseResponse create(@Valid @RequestBody CreateInhouseRequest request) {
        return inhouseService.create(request);
    }

    // The match is recorded under the in-house's ID. SecurityConfig only lets signed-in players through to the
    // writes, so getRemoteUser() is never null
    @PostMapping("/{id}/result")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reportResult(@PathVariable Long id, @RequestParam Side winner, HttpServletRequest request) {
        inhouseService.reportResult(id, winner, request.getRemoteUser(), request.isUserInRole("ADMIN"));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable Long id, HttpServletRequest request) {
        inhouseService.cancel(id, request.getRemoteUser(), request.isUserInRole("ADMIN"));
    }
}
