package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreateInhouseRequest;
import com.plainoldmoose.IDLWebApp.dto.response.inhouse.InhouseResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.Inhouse;
import com.plainoldmoose.IDLWebApp.model.enums.EloChangeReason;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.match.MatchParticipant;
import com.plainoldmoose.IDLWebApp.model.player.EloHistory;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.EloHistoryRepository;
import com.plainoldmoose.IDLWebApp.repository.InhouseRepository;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.stream.IntStream;
import java.util.stream.Stream;

@Service
@AllArgsConstructor
public class InhouseService {

    private final InhouseRepository inhouseRepository;
    private final PlayerRepository playerRepository;
    private final MatchRepository matchRepository;
    private final EloHistoryRepository eloHistoryRepository;

    public List<InhouseResponse> balanceOptions(List<String> steamIds) {
        List<Player> players = findTen(steamIds);
        return balance(players).stream()
                .map(radiant -> new InhouseResponse(null, null, summaries(radiant), summaries(players.stream()
                        .filter(player -> !radiant.contains(player))
                        .toList()), null, null))
                .toList();
    }

    public InhouseResponse create(CreateInhouseRequest request) {
        List<Player> players = findTen(Stream.concat(request.radiant().stream(), request.dire().stream()).toList());

        Inhouse inhouse = new Inhouse();
        for (Player player : players) {
            (request.radiant().contains(player.getSteamId()) ? inhouse.getRadiant() : inhouse.getDire()).add(player);
        }

        return toResponse(inhouseRepository.save(inhouse));
    }

    // Games with no result reported yet, newest first
    public List<InhouseResponse> getInProgress() {
        return inhouseRepository.findAllByReportedWinnerIsNullOrderByCreatedAtDesc()
                .stream()
                .map(InhouseService::toResponse)
                .toList();
    }

    // The admin queue: reported results, oldest first
    public List<InhouseResponse> getPending() {
        return inhouseRepository.findAllByReportedWinnerIsNotNullOrderByCreatedAtAsc()
                .stream()
                .map(InhouseService::toResponse)
                .toList();
    }

    // Records who won for an admin to check. Nobody's ELO moves until it's approved, admins' own reports included
    @Transactional
    public void reportResult(Long id, Side winner, String steamId, boolean admin) {
        Inhouse inhouse = findForPlayer(id, steamId, admin);
        inhouse.setReportedWinner(winner);
        inhouse.setReportedBy(playerRepository.getReferenceById(steamId));
    }

    // Turns the in-house into a match under the same ID and moves everyone's ELO. SecurityConfig keeps this admin-only
    @Transactional
    public void approve(Long id) {
        Inhouse inhouse = inhouseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "In-house not found"));
        Side winner = inhouse.getReportedWinner();
        if (winner == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nobody has reported this in-house's result yet");
        }
        double radiantChange = eloChange(average(inhouse.getRadiant()), average(inhouse.getDire()), winner);

        Match match = new Match();
        match.setMatchId(inhouse.getId());
        match.setPlayedTime(inhouse.getCreatedAt());
        match.setMatchWinner(winner);
        match.setAvgElo((int) Math.round((average(inhouse.getRadiant()) + average(inhouse.getDire())) / 2));
        match.setParticipants(new ArrayList<>());
        for (Side side : Side.values()) {
            for (Player player : side == Side.RADIANT ? inhouse.getRadiant() : inhouse.getDire()) {
                MatchParticipant participant = new MatchParticipant();
                participant.setMatch(match);
                participant.setPlayer(player);
                participant.setSide(side);
                match.getParticipants().add(participant);
            }
        }
        Match saved = matchRepository.save(match);

        LocalDateTime now = LocalDateTime.now();
        for (MatchParticipant participant : saved.getParticipants()) {
            Player player = participant.getPlayer();
            double change = participant.getSide() == Side.RADIANT ? radiantChange : -radiantChange;
            player.setElo(Math.round((player.getElo() + change) * 10) / 10.0);

            EloHistory eloHistory = new EloHistory();
            eloHistory.setPlayer(player);
            eloHistory.setMatch(saved);
            eloHistory.setElo(player.getElo());
            eloHistory.setEloChange(change);
            eloHistory.setTimestamp(now);
            eloHistory.setReason(participant.getSide() == winner ? EloChangeReason.MATCH_WIN : EloChangeReason.MATCH_LOSS);
            eloHistoryRepository.save(eloHistory);
        }

        inhouseRepository.delete(inhouse);
    }

    // For a game that never happened or had the wrong teams
    @Transactional
    public void cancel(Long id, String steamId, boolean admin) {
        inhouseRepository.delete(findForPlayer(id, steamId, admin));
    }

    // The 3 most even 5v5 splits, each as its Radiant five; Dire is everyone else.
    // ponytail: tries all 126 splits, instant for 10 players. Role preferences would add a cost next to the ELO gap
    static List<List<Player>> balance(List<Player> players) {
        double total = players.stream().mapToDouble(Player::getElo).sum();
        // Bit i set puts player i on Radiant. Player 0 always is, so a split and its mirror image aren't both offered
        return IntStream.range(0, 1 << 10)
                .filter(mask -> Integer.bitCount(mask) == 5 && (mask & 1) == 1)
                .mapToObj(mask -> IntStream.range(0, 10)
                        .filter(i -> (mask >> i & 1) == 1)
                        .mapToObj(players::get)
                        .toList())
                .sorted(Comparator.comparingDouble(radiant -> Math.abs(total - 2 * radiant.stream().mapToDouble(Player::getElo).sum())))
                .limit(3)
                .toList();
    }

    // Radiant's change; Dire's is the opposite. Expected result comes from the gap between the team averages.
    // ponytail: plain Elo with K = 32, a placeholder until the league's real ELO formula is written
    static double eloChange(double radiantAvg, double direAvg, Side winner) {
        double radiantExpected = 1 / (1 + Math.pow(10, (direAvg - radiantAvg) / 400));
        return Math.round(32 * ((winner == Side.RADIANT ? 1 : 0) - radiantExpected) * 10) / 10.0;
    }

    private static double average(List<Player> team) {
        return team.stream().mapToDouble(Player::getElo).average().orElse(0);
    }

    private List<Player> findTen(List<String> steamIds) {
        List<Player> players = playerRepository.findAllById(new HashSet<>(steamIds));
        if (steamIds.size() != 10 || players.size() != 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An in-house needs 10 different registered players");
        }
        return players;
    }

    // Only someone who played in it, or an admin, can report or cancel an in-house. Once a result is reported only an
    // admin can touch it, so the losing side can't cancel it or report it again the other way before it's approved
    private Inhouse findForPlayer(Long id, String steamId, boolean admin) {
        Inhouse inhouse = inhouseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "In-house not found"));
        if (admin) return inhouse;

        if (inhouse.getReportedWinner() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This in-house's result is waiting for an admin");
        }
        boolean played = Stream.concat(inhouse.getRadiant().stream(), inhouse.getDire().stream())
                .anyMatch(player -> player.getSteamId().equals(steamId));
        if (!played) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the in-house's players or an admin can do that");
        }
        return inhouse;
    }

    private static InhouseResponse toResponse(Inhouse inhouse) {
        return new InhouseResponse(inhouse.getId(), inhouse.getCreatedAt(), summaries(inhouse.getRadiant()), summaries(inhouse.getDire()),
                inhouse.getReportedWinner(), inhouse.getReportedBy() == null ? null : inhouse.getReportedBy().getUsername());
    }

    // Highest ELO first
    private static List<PlayerSummaryResponse> summaries(List<Player> team) {
        return team.stream()
                .sorted(Comparator.comparingDouble(Player::getElo).reversed())
                .map(PlayerSummaryResponse::from)
                .toList();
    }
}
