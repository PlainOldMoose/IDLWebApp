package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.dto.request.CreatePlayerRequest;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.service.PlayerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
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

    // Disabled players are only listed for admins; anyone else asking gets the normal list
    @GetMapping
    public List<PlayerSummaryResponse> getAllPlayersSummary(@RequestParam(defaultValue = "false") boolean includeDisabled,
                                                            HttpServletRequest request) {
        return playerService.getAllPlayersSummary(includeDisabled && request.isUserInRole("ADMIN"));
    }

    // Admin-only: SecurityConfig's catch-all covers every write
    @PutMapping("/{steamId}/disabled")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disable(@PathVariable String steamId) {
        playerService.disable(steamId);
    }

    @DeleteMapping("/{steamId}/disabled")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void enable(@PathVariable String steamId) {
        playerService.enable(steamId);
    }

    @GetMapping("/{steamId}")
    public PlayerDetailResponse findById(@PathVariable String steamId) {
        return playerService.findById(steamId);
    }
}
