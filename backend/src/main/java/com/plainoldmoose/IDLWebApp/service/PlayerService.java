package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreatePlayerRequest;
import com.plainoldmoose.IDLWebApp.dto.response.PlayerDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.Player;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;

    public List<PlayerSummaryResponse> getAllPlayersSummary() {
        List<PlayerSummaryResponse> playerlist = new ArrayList<>();

        List<Player> players = playerRepository.findAll();
        for (Player player : players) {
            playerlist.add(mapToResponse(player));
        }
        return playerlist;
    }

    public PlayerDetailResponse getPlayerById(String steamId) {
        Optional<Player> player = playerRepository.findBySteamId(steamId);

        if (player.isPresent()) {
            return mapToDetailResponse(player.get());
        }

        return null;
    }

    public PlayerSummaryResponse createPlayer(CreatePlayerRequest request) {
        Player player = new Player();
        player.setUsername(request.username());
        player.setElo(request.elo());
        player.setSteamId(request.steamId());
        Player saved = playerRepository.save(player);
        return mapToResponse(saved);
    }

    private PlayerSummaryResponse mapToResponse(Player player) {
        return new PlayerSummaryResponse(player.getUsername(), player.getElo(), player.getSteamId());
    }

    private PlayerDetailResponse mapToDetailResponse(Player player) {
        return new PlayerDetailResponse(player.getId(), player.getUsername(), player.getElo(), player.getSteamId(), player.getCreatedAt(), player.getEloHistory(), player.getMatchParticipations(), player.getTeamMemberships());
    }
}
