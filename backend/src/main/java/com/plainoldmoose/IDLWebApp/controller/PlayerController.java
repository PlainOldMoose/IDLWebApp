package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.dto.request.CreatePlayerRequest;
import com.plainoldmoose.IDLWebApp.dto.response.PlayerDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.service.PlayerService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/players")
public class PlayerController {
    private final PlayerService playerService;

    @GetMapping
    public List<PlayerSummaryResponse> getAllPlayersSummary() {
        return playerService.getAllPlayersSummary();
    }

    @GetMapping("/{steamId}")
    public PlayerDetailResponse getPlayerById(@PathVariable String steamId) {
        return playerService.getPlayerById(steamId);
    }

    @PostMapping
    public PlayerSummaryResponse createPlayer(@Valid @RequestBody CreatePlayerRequest request) {
        return playerService.createPlayer(request);
    }
}
