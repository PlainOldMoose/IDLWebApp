package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.model.Player;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Service
@AllArgsConstructor
public class PlayerService {

    private PlayerRepository playerRepository;

    @GetMapping
    public List<Player> getAllPlayers() {
        return playerRepository.findAll();
    }

    public void insertPlayer(Player player) {
        playerRepository.save(player);
    }
}
