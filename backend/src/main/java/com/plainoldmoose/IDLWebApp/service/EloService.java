package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.match.MatchParticipant;
import com.plainoldmoose.IDLWebApp.model.player.EloHistory;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.EloHistoryRepository;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.BinaryOperator;
import java.util.function.Function;
import java.util.stream.Collectors;

// The only thing that moves anyone's ELO. A game added or removed in the past changes every later game's K and expected
// result, so callers rewind to the game's time, change the matches, then replay everything from there
@Service
@AllArgsConstructor
public class EloService {

    // The formula's S: how much a game is worth
    private static final double SEASON_STAKE = 15;
    private static final double IN_HOUSE_STAKE = 7.5;

    private final MatchRepository matchRepository;
    private final EloHistoryRepository eloHistoryRepository;
    private final SeasonRepository seasonRepository;

    // Puts everyone back on the ELO they had before `from` and drops the history of every game played since. Run it
    // before deleting a match, while that match's history still says what it did
    public void rewind(LocalDateTime from) {
        List<EloHistory> rows = eloHistoryRepository.findByMatchPlayedTimeGreaterThanEqual(from);
        rows.stream()
                .collect(Collectors.toMap(row -> row.getPlayer().getSteamId(), Function.identity(),
                        BinaryOperator.minBy(Comparator.comparing(row -> row.getMatch().getPlayedTime()))))
                .values()
                .forEach(first -> first.getPlayer().setElo(round(first.getElo() - first.getEloChange())));
        eloHistoryRepository.deleteAll(rows);
    }

    // Plays every game from `from` on back through the formula, oldest first, moving ELO and writing history as it goes.
    // NOTE: ~4 queries per player per game for K's inputs, fine for an active season's worth; batch them if it gets slow
    public void replay(LocalDateTime from) {
        for (Match match : matchRepository.findByPlayedTimeGreaterThanEqualOrderByPlayedTimeAscMatchIdAsc(from)) {
            match.setAvgElo((int) Math.round(average(match.getParticipants().stream().map(MatchParticipant::getPlayer).toList())));
            Map<String, Double> changes = changes(match);
            for (MatchParticipant participant : match.getParticipants()) {
                Player player = participant.getPlayer();
                double change = changes.get(player.getSteamId());
                player.setElo(round(player.getElo() + change));

                EloHistory eloHistory = new EloHistory();
                eloHistory.setPlayer(player);
                eloHistory.setMatch(match);
                eloHistory.setElo(player.getElo());
                eloHistory.setEloChange(change);
                eloHistory.setTimestamp(match.getPlayedTime());
                eloHistoryRepository.save(eloHistory);
            }
        }
    }

    // Each player's ELO change for the match's result, by Steam ID, from everyone's ELO right now. Unlike plain Elo it
    // differs player to player, through their own K. Game counts stop short of the match's own time, so it doesn't
    // count itself whether it's saved yet or not
    public Map<String, Double> changes(Match match) {
        LocalDateTime played = match.getPlayedTime();
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

        double stake = match.getSeason() == null ? IN_HOUSE_STAKE : SEASON_STAKE;
        Map<Side, List<Player>> sides = match.getParticipants().stream()
                .collect(Collectors.groupingBy(MatchParticipant::getSide,
                        Collectors.mapping(MatchParticipant::getPlayer, Collectors.toList())));
        Map<String, Double> changes = new HashMap<>();
        for (MatchParticipant participant : match.getParticipants()) {
            Side side = participant.getSide();
            Player player = participant.getPlayer();
            changes.put(player.getSteamId(), eloChange(k(player, played, seasonStart, previousStart), stake,
                    average(sides.get(side)), average(sides.get(side == Side.RADIANT ? Side.DIRE : Side.RADIANT)),
                    side == match.getMatchWinner()));
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
        return round(k * stake * ((won ? 1 : 0) - expectedResult(teamAvg, opponentAvg)));
    }

    // A team's chance of winning, 0 to 1, from the gap between the team averages
    static double expectedResult(double teamAvg, double opponentAvg) {
        return 1 / (1 + Math.pow(10, (opponentAvg - teamAvg) / 400));
    }

    static double average(List<Player> team) {
        return team.stream().mapToDouble(Player::getElo).average().orElse(0);
    }

    private static double round(double elo) {
        return Math.round(elo * 10) / 10.0;
    }
}
