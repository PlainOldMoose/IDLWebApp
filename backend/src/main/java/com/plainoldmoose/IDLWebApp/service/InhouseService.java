package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreateInhouseRequest;
import com.plainoldmoose.IDLWebApp.dto.response.inhouse.InhouseResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.Inhouse;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.match.MatchParticipant;
import com.plainoldmoose.IDLWebApp.model.player.Player;
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
import java.util.Map;
import java.util.stream.IntStream;
import java.util.stream.Stream;

@Service
@AllArgsConstructor
public class InhouseService {

    private final InhouseRepository inhouseRepository;
    private final PlayerRepository playerRepository;
    private final MatchRepository matchRepository;
    private final EloService eloService;

    public List<InhouseResponse> balanceOptions(List<String> steamIds) {
        List<Player> players = findTen(steamIds);
        return balance(players).stream()
                .map(teamA -> new InhouseResponse(null, null, summaries(teamA), summaries(players.stream()
                        .filter(player -> !teamA.contains(player))
                        .toList()), null, null, null, null))
                .toList();
    }

    public InhouseResponse create(CreateInhouseRequest request) {
        List<Player> players = findTen(Stream.concat(request.teamA().stream(), request.teamB().stream()).toList());

        Inhouse inhouse = new Inhouse();
        for (Player player : players) {
            (request.teamA().contains(player.getSteamId()) ? inhouse.getTeamA() : inhouse.getTeamB()).add(player);
        }

        return toResponse(inhouseRepository.save(inhouse), null);
    }

    public List<InhouseResponse> getInProgress() {
        return inhouseRepository.findAllByReportedWinnerIsNullOrderByCreatedAtDesc()
                .stream()
                .map(inhouse -> toResponse(inhouse, null))
                .toList();
    }

    // The admin queue: reported results, oldest first, with what approving each would do to everyone's ELO
    public List<InhouseResponse> getPending() {
        return inhouseRepository.findAllByReportedWinnerIsNotNullOrderByCreatedAtAsc()
                .stream()
                .map(inhouse -> toResponse(inhouse, eloService.changes(toMatch(inhouse))))
                .toList();
    }

    // Records who won and which side Team A played, for an admin to check. Nobody's ELO moves until it's approved,
    // admins' own reports included
    @Transactional
    public void reportResult(Long id, Side teamASide, Side winner, String steamId, boolean admin) {
        Inhouse inhouse = findForPlayer(id, steamId, admin);
        inhouse.setTeamASide(teamASide);
        inhouse.setReportedWinner(winner);
        inhouse.setReportedBy(playerRepository.getReferenceById(steamId));
    }

    // Turns the in-house into a match under the same ID and moves everyone's ELO
    @Transactional
    public void approve(Long id) {
        Inhouse inhouse = inhouseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "In-house not found"));
        if (inhouse.getReportedWinner() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nobody has reported this in-house's result yet");
        }
        // Replayed from when it was played, so approving it after later games still moves ELO in the order they happened
        LocalDateTime played = inhouse.getCreatedAt();
        eloService.rewind(played);
        matchRepository.save(toMatch(inhouse));
        eloService.replay(played);

        inhouseRepository.delete(inhouse);
    }

    // For a game that never happened or had the wrong teams
    @Transactional
    public void cancel(Long id, String steamId, boolean admin) {
        inhouseRepository.delete(findForPlayer(id, steamId, admin));
    }

    // The 3 most even 5v5 splits, each as its Team A five; Team B is everyone else.
    // NOTE: tries all 126 splits, instant for 10 players. Role preferences would add a cost next to the ELO gap
    static List<List<Player>> balance(List<Player> players) {
        double total = players.stream().mapToDouble(Player::getElo).sum();
        // Bit i set puts player i on Team A. Player 0 always is, so a split and its mirror image aren't both offered
        return IntStream.range(0, 1 << 10)
                .filter(mask -> Integer.bitCount(mask) == 5 && (mask & 1) == 1)
                .mapToObj(mask -> IntStream.range(0, 10)
                        .filter(i -> (mask >> i & 1) == 1)
                        .mapToObj(players::get)
                        .toList())
                .sorted(Comparator.comparingDouble(teamA -> Math.abs(total - 2 * teamA.stream().mapToDouble(Player::getElo).sum())))
                .limit(3)
                .toList();
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
        boolean played = Stream.concat(inhouse.getTeamA().stream(), inhouse.getTeamB().stream())
                .anyMatch(player -> player.getSteamId().equals(steamId));
        if (!played) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the in-house's players or an admin can do that");
        }
        return inhouse;
    }

    // The match the in-house becomes, under the same ID. Team A's reported side decides who was Radiant. A row reported
    // before sides were asked for has none: Team A was Radiant then
    private static Match toMatch(Inhouse inhouse) {
        Match match = new Match();
        match.setMatchId(inhouse.getId());
        match.setPlayedTime(inhouse.getCreatedAt());
        match.setMatchWinner(inhouse.getReportedWinner());
        match.setParticipants(new ArrayList<>());
        boolean teamADire = inhouse.getTeamASide() == Side.DIRE;
        for (boolean teamA : new boolean[]{true, false}) {
            for (Player player : teamA ? inhouse.getTeamA() : inhouse.getTeamB()) {
                MatchParticipant participant = new MatchParticipant();
                participant.setMatch(match);
                participant.setPlayer(player);
                participant.setSide(teamA != teamADire ? Side.RADIANT : Side.DIRE);
                match.getParticipants().add(participant);
            }
        }
        return match;
    }

    private static InhouseResponse toResponse(Inhouse inhouse, Map<String, Double> eloChanges) {
        return new InhouseResponse(inhouse.getId(), inhouse.getCreatedAt(), summaries(inhouse.getTeamA()), summaries(inhouse.getTeamB()),
                inhouse.getReportedWinner(), inhouse.getTeamASide(),
                inhouse.getReportedBy() == null ? null : inhouse.getReportedBy().getUsername(), eloChanges);
    }

    private static List<PlayerSummaryResponse> summaries(List<Player> team) {
        return team.stream()
                .sorted(Comparator.comparingDouble(Player::getElo).reversed())
                .map(PlayerSummaryResponse::from)
                .toList();
    }
}
