package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.dto.request.CreatePlayerRequest;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
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

    @PostMapping
    public PlayerSummaryResponse createPlayer(@Valid @RequestBody CreatePlayerRequest request) {
        return playerService.createPlayer(request);
    }

    @GetMapping
    public List<PlayerSummaryResponse> getAllPlayersSummary() {
        return playerService.getAllPlayersSummary();
    }

    @GetMapping("/{steamId}")
    public PlayerDetailResponse findById(@PathVariable String steamId) {
        return playerService.findById(steamId);
    }
}
