package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreateInhouseRequest;
import com.plainoldmoose.IDLWebApp.dto.response.inhouse.InhouseResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.Inhouse;
import com.plainoldmoose.IDLWebApp.model.Season;
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
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.IntStream;
import java.util.stream.Stream;

@Service
@AllArgsConstructor
public class InhouseService {

    // The formula's S: how much a game is worth. A season game is 15
    private static final double IN_HOUSE_STAKE = 7.5;

    private final InhouseRepository inhouseRepository;
    private final PlayerRepository playerRepository;
    private final MatchRepository matchRepository;
    private final EloHistoryRepository eloHistoryRepository;
    private final SeasonRepository seasonRepository;

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

    // Games with no result reported yet, newest first
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
                .map(inhouse -> toResponse(inhouse, eloChanges(inhouse)))
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

    // Turns the in-house into a match under the same ID and moves everyone's ELO. SecurityConfig keeps this admin-only
    @Transactional
    public void approve(Long id) {
        Inhouse inhouse = inhouseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "In-house not found"));
        Side winner = inhouse.getReportedWinner();
        if (winner == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nobody has reported this in-house's result yet");
        }
        // Team A's reported side decides who was Radiant. A row reported before sides were asked for has none: Team A was Radiant then
        boolean teamADire = inhouse.getTeamASide() == Side.DIRE;
        List<Player> radiant = teamADire ? inhouse.getTeamB() : inhouse.getTeamA();
        List<Player> dire = teamADire ? inhouse.getTeamA() : inhouse.getTeamB();
        // Worked out before the match is saved, so this game isn't in anyone's game count yet
        Map<String, Double> changes = eloChanges(inhouse);

        Match match = new Match();
        match.setMatchId(inhouse.getId());
        match.setPlayedTime(inhouse.getCreatedAt());
        match.setMatchWinner(winner);
        match.setAvgElo((int) Math.round((average(radiant) + average(dire)) / 2));
        match.setParticipants(new ArrayList<>());
        for (Side side : Side.values()) {
            for (Player player : side == Side.RADIANT ? radiant : dire) {
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
            double change = changes.get(player.getSteamId());
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

    // The 3 most even 5v5 splits, each as its Team A five; Team B is everyone else.
    // ponytail: tries all 126 splits, instant for 10 players. Role preferences would add a cost next to the ELO gap
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

    // Each player's ELO change if the reported result stands, by Steam ID. Unlike plain Elo it differs player to
    // player, through their own K
    private Map<String, Double> eloChanges(Inhouse inhouse) {
        LocalDateTime played = inhouse.getCreatedAt();
        // The season this game falls in, and the one before. Before the first season, every game counts as this season's
        List<LocalDateTime> starts = seasonRepository.findAllByOrderByStartDateDesc()
                .stream()
                .map(Season::getStartDate)
                .filter(Objects::nonNull)
                .map(LocalDate::atStartOfDay)
                .filter(start -> !start.isAfter(played))
                .toList();
        LocalDateTime seasonStart = starts.isEmpty() ? null : starts.get(0);
        LocalDateTime previousStart = starts.size() < 2 ? null : starts.get(1);

        Side teamASide = inhouse.getTeamASide() == null ? Side.RADIANT : inhouse.getTeamASide();
        boolean teamAWon = inhouse.getReportedWinner() == teamASide;
        Map<String, Double> changes = new HashMap<>();
        for (boolean teamA : new boolean[]{true, false}) {
            List<Player> team = teamA ? inhouse.getTeamA() : inhouse.getTeamB();
            List<Player> opponents = teamA ? inhouse.getTeamB() : inhouse.getTeamA();
            for (Player player : team) {
                changes.put(player.getSteamId(), eloChange(k(player, played, seasonStart, previousStart), IN_HOUSE_STAKE,
                        average(team), average(opponents), teamA == teamAWon));
            }
        }
        return changes;
    }

    // Looks up the formula's inputs for a player: P, H, L and N
    private double k(Player player, LocalDateTime played, LocalDateTime seasonStart, LocalDateTime previousStart) {
        String steamId = player.getSteamId();
        int earlierGames = seasonStart == null ? 0 : (int) matchRepository.countGamesBefore(steamId, seasonStart);
        int seasonGames = (int) matchRepository.countGamesBefore(steamId, played) - earlierGames;
        LocalDateTime lastPlayed = seasonStart == null ? null : matchRepository.lastPlayedBefore(steamId, seasonStart);
        int gamesMissed = lastPlayed == null ? 0 : (int) matchRepository.countSeasonGamesBetween(lastPlayed, seasonStart);
        // Their ELO when the previous season started; their starting ELO if they joined after that
        double previousSeasonElo = (previousStart == null ? Optional.<EloHistory>empty()
                : eloHistoryRepository.findFirstByPlayerSteamIdAndTimestampBeforeOrderByTimestampDesc(steamId, previousStart))
                .or(() -> eloHistoryRepository.findFirstByPlayerSteamIdOrderByTimestampAsc(steamId))
                .map(EloHistory::getElo)
                .orElse(player.getElo());
        return k(player.getElo(), previousSeasonElo, earlierGames, gamesMissed, seasonGames);
    }

    // The league's K. It's bigger for players far from where they were a season ago, and for players with few games.
    // The experience term is the sheet's "k modifier": earlier seasons' games, discounted the more season games they've
    // missed since (down to a third), plus this season's. The written formula has H(1 − L) / (1.5 × (200 + L)), but
    // that turns negative after 2 missed games and leaves K undefined. This version matches the sheet's K values
    static double k(double current, double previousSeasonElo, int earlierGames, int gamesMissed, int seasonGames) {
        double experience = earlierGames * (1 - gamesMissed / (1.5 * (200 + gamesMissed))) + seasonGames;
        return (Math.pow(Math.abs(current - previousSeasonElo), 0.75) / 90 + 0.92)
                * (1 + 20 / (20 + Math.pow(experience, 1.19)));
    }

    // K × S × (W − expected), where the expected result comes from the gap between the team averages
    static double eloChange(double k, double stake, double teamAvg, double opponentAvg, boolean won) {
        double expected = 1 / (1 + Math.pow(10, (opponentAvg - teamAvg) / 400));
        return Math.round(k * stake * ((won ? 1 : 0) - expected) * 10) / 10.0;
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
        boolean played = Stream.concat(inhouse.getTeamA().stream(), inhouse.getTeamB().stream())
                .anyMatch(player -> player.getSteamId().equals(steamId));
        if (!played) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the in-house's players or an admin can do that");
        }
        return inhouse;
    }

    private static InhouseResponse toResponse(Inhouse inhouse, Map<String, Double> eloChanges) {
        return new InhouseResponse(inhouse.getId(), inhouse.getCreatedAt(), summaries(inhouse.getTeamA()), summaries(inhouse.getTeamB()),
                inhouse.getReportedWinner(), inhouse.getTeamASide(),
                inhouse.getReportedBy() == null ? null : inhouse.getReportedBy().getUsername(), eloChanges);
    }

    // Highest ELO first
    private static List<PlayerSummaryResponse> summaries(List<Player> team) {
        return team.stream()
                .sorted(Comparator.comparingDouble(Player::getElo).reversed())
                .map(PlayerSummaryResponse::from)
                .toList();
    }
}
