package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreatePlayerRequest;
import com.plainoldmoose.IDLWebApp.dto.response.auth.SteamUserResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerMatchResponse;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.match.MatchParticipant;
import com.plainoldmoose.IDLWebApp.model.player.EloHistory;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.EloHistoryRepository;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonSignupRepository;
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
    private final SeasonSignupRepository seasonSignupRepository;

    @Transactional
    public PlayerSummaryResponse createPlayer(CreatePlayerRequest request) {
        if (playerRepository.existsById(request.steamId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SteamID already exists");
        }
        if (playerRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already exists");
        }

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
        eloHistoryRepository.save(eloHistory);

        return PlayerSummaryResponse.from(saved);
    }

    // For banned or long-inactive players who can't be deleted because they've played. Admins are refused, so an
    // admin can't lock themselves or another admin out
    @Transactional
    public void disable(String steamId) {
        Player player = find(steamId);
        if (player.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Admins can't be disabled");
        }
        player.setDisabledAt(LocalDateTime.now());
        playerRepository.save(player);
        // Seasons already drafted keep them on their team
        seasonSignupRepository.deleteByPlayerSteamIdAndSeasonStatus(steamId, SeasonStatus.REGISTRATION);
    }

    public void enable(String steamId) {
        Player player = find(steamId);
        player.setDisabledAt(null);
        playerRepository.save(player);
    }

    public List<PlayerSummaryResponse> getAllPlayersSummary(boolean includeDisabled) {
        return (includeDisabled ? playerRepository.findAllByOrderByEloDesc() : playerRepository.findAllByDisabledAtIsNullOrderByEloDesc())
                .stream()
                .map(PlayerSummaryResponse::from)
                .toList();
    }

    private Player find(String steamId) {
        return playerRepository.findById(steamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found with SteamID: " + steamId));
    }

    public PlayerDetailResponse findById(String steamId) {
        return mapToDetailResponse(find(steamId));
    }

    public Optional<SteamUserResponse> findSteamUser(String steamId) {
        return playerRepository.findById(steamId)
                .map(player -> new SteamUserResponse(player.getSteamId(), player.getUsername(), player.isAdmin(), player.isDisabled()));
    }

    private PlayerDetailResponse mapToDetailResponse(Player player) {
        List<MatchParticipant> matchParticipations = player.getMatchParticipations();

        // Forfeits are listed but nobody played them, so they stay out of the record
        List<MatchParticipant> played = matchParticipations.stream().filter(mp -> !mp.getMatch().isForfeit()).toList();
        int wins = (int) played.stream()
                .filter(mp -> mp.getMatch().getMatchWinner() == mp.getSide())
                .count();
        int losses = played.size() - wins;
        double winrate = played.isEmpty() ? 0.0 : Math.round((double) wins / played.size() * 10000) / 100.0;

        List<PlayerMatchResponse> matches = matchParticipations
                .stream()
                .filter(mp -> mp.getMatch()
                        .getPlayedTime() != null)
                .sorted(Comparator.comparing(mp -> mp.getMatch()
                        .getPlayedTime(), Comparator.reverseOrder()))
                .map(mp -> {
                    Match match = mp.getMatch();
                    boolean won = mp.getSide() == match.getMatchWinner();

                    Double eloChange = player.getEloHistory().stream()
                            .filter(eh -> eh.getMatch() != null && eh.getMatch()
                                    .getMatchId()
                                    .equals(match.getMatchId()))
                            .findFirst()
                            .map(EloHistory::getEloChange)
                            .orElse(null);
                    return new PlayerMatchResponse(match.getMatchId(),
                            match.getPlayedTime(),
                            won,
                            mp.getSide(),
                            mp.isSub(),
                            eloChange,
                            match.getSeason() != null ? match.getSeason().getId() : null,
                            match.getSeason() != null ? match.getSeason()
                                    .getName() : null,
                            match.isForfeit());
                }).toList();

        return new PlayerDetailResponse(
                player.getSteamId(),
                player.getUsername(),
                player.getElo(),
                wins,
                losses,
                winrate,
                player.isDisabled(),
                player.getDisabledAt(),
                matches
        );
    }
}
