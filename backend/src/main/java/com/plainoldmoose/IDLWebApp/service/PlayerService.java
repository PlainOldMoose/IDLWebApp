package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreatePlayerRequest;
import com.plainoldmoose.IDLWebApp.dto.response.auth.SteamUserResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.RecentMatchResponse;
import com.plainoldmoose.IDLWebApp.model.enums.EloChangeReason;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.player.EloHistory;
import com.plainoldmoose.IDLWebApp.model.player.EloSnapshot;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.EloHistoryRepository;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final EloHistoryRepository eloHistoryRepository;

    @Transactional
    public PlayerSummaryResponse createPlayer(CreatePlayerRequest request) {
        validateSteamIdUnique(request.steamId());
        validateUsernameUnique(request.username());

        // Copy request to entity and save to repo
        Player player = new Player();
        player.setUsername(request.username());
        player.setElo(request.elo());
        player.setSteamId(request.steamId());

        Player saved = playerRepository.save(player);

        EloHistory eloHistory = new EloHistory();
        eloHistory.setPlayer(saved);
        eloHistory.setElo(saved.getElo());
        eloHistory.setTimestamp(LocalDateTime.now());
        eloHistory.setEloChange(0);
        eloHistory.setReason(EloChangeReason.INITIAL);
        eloHistory.setMatch(null);
        eloHistoryRepository.save(eloHistory);

        return mapToSummaryResponse(saved);
    }

    public List<PlayerSummaryResponse> getAllPlayersSummary() {
        return playerRepository.findAll()
                .stream()
                .map(this::mapToSummaryResponse)
                .toList();
    }

    public PlayerDetailResponse findById(String steamId) {
        Player player = findPlayerOrThrow(steamId);
        return mapToDetailResponse(player);
    }

    public boolean existsBySteamId(String steamId) {
        return playerRepository.existsById(steamId);
    }

    public Optional<SteamUserResponse> findSteamUser(String steamId) {
        return playerRepository.findById(steamId)
                .map(player -> new SteamUserResponse(player.getSteamId(), player.getUsername()));
    }

    private Player findPlayerOrThrow(String steamId) {
        return playerRepository.findById(steamId)
                .orElseThrow(() -> new EntityNotFoundException("Player not found with SteamID: " + steamId));
    }

    private void validateUsernameUnique(String username) {
        if (playerRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
    }

    private void validateSteamIdUnique(String steamId) {
        if (playerRepository.existsById(steamId)) {
            throw new IllegalArgumentException("SteamID already exists");
        }
    }

    private PlayerSummaryResponse mapToSummaryResponse(Player player) {
        return new PlayerSummaryResponse(player.getUsername(), player.getElo(), player.getSteamId());
    }

    private PlayerDetailResponse mapToDetailResponse(Player player) {
        List<EloHistory> eloHistoryList = player.getEloHistory()
                .stream()
                .sorted(Comparator.comparing(EloHistory::getTimestamp))
                .toList();

        // Calculate wins/losses from EloHistory
        int wins = (int) eloHistoryList.stream()
                .filter(history -> history.getReason() == EloChangeReason.MATCH_WIN)
                .count();

        int losses = (int) eloHistoryList.stream()
                .filter(history -> history.getReason() == EloChangeReason.MATCH_LOSS)
                .count();

        int matchesPlayed = wins + losses;
        double winrate = matchesPlayed > 0 ? (double) wins / matchesPlayed * 100 : 0.0;

        List<EloSnapshot> eloHistory = player.getEloHistory()
                .stream()
                .map(eh -> new EloSnapshot(eh.getMatch() != null ? eh.getMatch()
                        .getMatchId() : null, eh.getElo()))
                .toList();

        // Build last 20 matches
        List<RecentMatchResponse> recentMatches = player.getMatchParticipations()
                .stream()
                .filter(mp -> mp.getMatch()
                        .getPlayedTime() != null)
                .sorted(Comparator.comparing(mp -> mp.getMatch()
                        .getPlayedTime(), Comparator.reverseOrder()))
                .limit(20).map(mp -> {
                    Match match = mp.getMatch();
                    boolean won = mp.getSide() == match.getMatchWinner();

                    // Find eloChange for this match from eloHistory
                    int eloChange = eloHistoryList.stream()
                            .filter(eh -> eh.getMatch() != null && eh.getMatch()
                                    .getMatchId()
                                    .equals(match.getMatchId()))
                            .findFirst()
                            .map(EloHistory::getEloChange)
                            .orElse(0);
                    return new RecentMatchResponse(match.getMatchId(),
                            match.getPlayedTime(),
                            won,
                            eloChange,
                            match.getSeason() != null ? match.getSeason()
                                    .getName() : null);
                }).toList();

        return new PlayerDetailResponse(
                player.getSteamId(),
                player.getUsername(),
                player.getElo(),
                matchesPlayed,
                wins,
                losses,
                winrate,
                recentMatches,
                eloHistory
        );
    }
}
