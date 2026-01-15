package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.model.Player;
import com.plainoldmoose.IDLWebApp.service.PlayerService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/players")
public class PlayerController {
    private final PlayerService playerService;

    @GetMapping
    public List<Player> getAllPlayers() {
        return playerService.getAllPlayers();
    }

    @PostMapping
    public void addNewPlayer(@RequestBody Player player) {
        playerService.insertPlayer(player);
    }
}
