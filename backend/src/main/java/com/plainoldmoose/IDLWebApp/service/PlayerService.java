package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreatePlayerRequest;
import com.plainoldmoose.IDLWebApp.dto.response.auth.SteamUserResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.RecentMatchResponse;
import com.plainoldmoose.IDLWebApp.model.enums.EloChangeReason;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.match.MatchParticipant;
import com.plainoldmoose.IDLWebApp.model.player.EloHistory;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.EloHistoryRepository;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
        if (playerRepository.existsById(request.steamId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SteamID already exists");
        }
        if (playerRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already exists");
        }

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

    // Highest ELO first, so list position is rank
    public List<PlayerSummaryResponse> getAllPlayersSummary() {
        return playerRepository.findAllByOrderByEloDesc()
                .stream()
                .map(this::mapToSummaryResponse)
                .toList();
    }

    public PlayerDetailResponse findById(String steamId) {
        return playerRepository.findById(steamId)
                .map(this::mapToDetailResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found with SteamID: " + steamId));
    }

    public Optional<SteamUserResponse> findSteamUser(String steamId) {
        return playerRepository.findById(steamId)
                .map(player -> new SteamUserResponse(player.getSteamId(), player.getUsername()));
    }

    private PlayerSummaryResponse mapToSummaryResponse(Player player) {
        return new PlayerSummaryResponse(player.getUsername(), player.getElo(), player.getSteamId());
    }

    private PlayerDetailResponse mapToDetailResponse(Player player) {
        List<MatchParticipant> matchParticipations = player.getMatchParticipations();

        int wins = (int) matchParticipations.stream()
                .filter(mp -> mp.getMatch().getMatchWinner() == mp.getSide())
                .count();
        int losses = matchParticipations.size() - wins;
        double winrate = matchParticipations.isEmpty() ? 0.0 : Math.round((double) wins / matchParticipations.size() * 10000) / 100.0;

        // Build last 20 matches
        List<RecentMatchResponse> recentMatches = matchParticipations
                .stream()
                .filter(mp -> mp.getMatch()
                        .getPlayedTime() != null)
                .sorted(Comparator.comparing(mp -> mp.getMatch()
                        .getPlayedTime(), Comparator.reverseOrder()))
                .limit(20).map(mp -> {
                    Match match = mp.getMatch();
                    boolean won = mp.getSide() == match.getMatchWinner();

                    // Find eloChange for this match from eloHistory; null if the match has no ELO record
                    Double eloChange = player.getEloHistory().stream()
                            .filter(eh -> eh.getMatch() != null && eh.getMatch()
                                    .getMatchId()
                                    .equals(match.getMatchId()))
                            .findFirst()
                            .map(EloHistory::getEloChange)
                            .orElse(null);
                    return new RecentMatchResponse(match.getMatchId(),
                            match.getPlayedTime(),
                            won,
                            mp.getSide(),
                            mp.getIsSub() != null && mp.getIsSub(),
                            eloChange,
                            match.getSeason() != null ? match.getSeason()
                                    .getName() : null);
                }).toList();

        return new PlayerDetailResponse(
                player.getSteamId(),
                player.getUsername(),
                player.getElo(),
                wins,
                losses,
                winrate,
                recentMatches
        );
    }
}
