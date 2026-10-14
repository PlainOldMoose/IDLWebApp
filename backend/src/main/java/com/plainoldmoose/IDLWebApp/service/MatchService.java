package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreateMatchRequest;
import com.plainoldmoose.IDLWebApp.dto.response.match.BinMatchResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.MatchDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.MatchPlayerResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.MatchSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.TeamStandingResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.TeamMember;
import com.plainoldmoose.IDLWebApp.model.enums.LeagueMatchStatus;
import com.plainoldmoose.IDLWebApp.model.enums.MatchSource;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.match.DeletedMatch;
import com.plainoldmoose.IDLWebApp.model.match.LeagueMatch;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.match.MatchParticipant;
import com.plainoldmoose.IDLWebApp.model.player.EloHistory;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.DeletedMatchRepository;
import com.plainoldmoose.IDLWebApp.repository.EloHistoryRepository;
import com.plainoldmoose.IDLWebApp.repository.LeagueMatchRepository;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@AllArgsConstructor
public class MatchService {
    // How long a deleted match stays in the bin
    private static final int BIN_DAYS = 7;

    private final MatchRepository matchRepository;
    private final EloHistoryRepository eloHistoryRepository;
    private final SeasonRepository seasonRepository;
    private final PlayerRepository playerRepository;
    private final EloService eloService;
    private final LeagueMatchRepository leagueMatchRepository;
    private final DeletedMatchRepository deletedMatchRepository;

    public List<MatchSummaryResponse> getAllMatches(UUID seasonId, Integer limit) {
        if (limit != null && limit < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "limit must be at least 1");
        }
        Limit max = limit == null ? Limit.unlimited() : Limit.of(limit);
        List<Match> matches = seasonId != null
                ? matchRepository.findBySeasonIdOrderByPlayedTimeDesc(seasonId, max)
                : matchRepository.findAllByOrderByPlayedTimeDesc(max);

        return matches.stream()
                .map(this::mapToSummaryResponse)
                .toList();
    }

    public MatchDetailResponse getMatch(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match not found"));

        Map<String, EloHistory> eloBySteamId = eloHistoryRepository.findByMatchMatchId(matchId)
                .stream()
                .collect(Collectors.toMap(eh -> eh.getPlayer().getSteamId(), Function.identity()));

        List<MatchPlayerResponse> players = match.getParticipants()
                .stream()
                .map(mp -> {
                    EloHistory elo = eloBySteamId.get(mp.getPlayer().getSteamId());
                    return new MatchPlayerResponse(
                            mp.getPlayer().getSteamId(),
                            mp.getPlayer().getUsername(),
                            mp.getSide(),
                            mp.isSub(),
                            mp.getSubbingFor() != null ? mp.getSubbingFor().getUsername() : null,
                            // History stores the ELO after the match
                            elo != null ? elo.getElo() - elo.getEloChange() : null,
                            elo != null ? elo.getEloChange() : null);
                })
                .sorted(Comparator.comparing(MatchPlayerResponse::eloBefore, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        Map<UUID, TeamStandingResponse> standings = match.getSeason() != null ? standingsGoingInto(match) : Map.of();
        return new MatchDetailResponse(mapToSummaryResponse(match), players,
                match.getRadiantTeam() != null ? standings.get(match.getRadiantTeam().getTeamId()) : null,
                match.getDireTeam() != null ? standings.get(match.getDireTeam().getTeamId()) : null,
                radiantWinChance(players),
                // A match the sync ever found is its, even when an admin typed it in from the queue
                leagueMatchRepository.existsById(matchId) ? MatchSource.API_SYNC : MatchSource.MANUAL);
    }

    // Only when all 10 players have an ELO record: then their ELO going in is what the replay averaged for this game
    private static Double radiantWinChance(List<MatchPlayerResponse> players) {
        if (players.size() != 10 || players.stream().anyMatch(p -> p.eloBefore() == null)) return null;
        return EloService.expectedResult(averageEloBefore(players, Side.RADIANT), averageEloBefore(players, Side.DIRE));
    }

    private static double averageEloBefore(List<MatchPlayerResponse> players, Side side) {
        return players.stream().filter(p -> p.side() == side).mapToDouble(MatchPlayerResponse::eloBefore).average().orElse(0);
    }

    // Each team's place in the season table just before this match. The stored W/L are today's, so this match and every
    // later one (in the ELO replay's order) come off them. Exact as long as the sheet's seeded games came first
    private Map<UUID, TeamStandingResponse> standingsGoingInto(Match match) {
        Map<UUID, Integer> wins = new HashMap<>();
        Map<UUID, Integer> losses = new HashMap<>();
        List<Team> teams = match.getSeason().getTeams();
        teams.forEach(team -> {
            wins.put(team.getTeamId(), team.getWins());
            losses.put(team.getTeamId(), team.getLosses());
        });

        Comparator<Match> replayOrder = Comparator.comparing(Match::getPlayedTime).thenComparing(Match::getMatchId);
        for (Match later : matchRepository.findBySeasonIdOrderByPlayedTimeDesc(match.getSeason().getId())) {
            if (replayOrder.compare(later, match) < 0) continue;
            Team winner = winner(later);
            Team loser = loser(later);
            if (winner != null) wins.merge(winner.getTeamId(), -1, Integer::sum);
            if (loser != null) losses.merge(loser.getTeamId(), -1, Integer::sum);
        }

        List<UUID> table = teams.stream()
                .map(Team::getTeamId)
                .sorted(Team.tableOrder(wins::get, losses::get))
                .toList();
        return table.stream().collect(Collectors.toMap(Function.identity(),
                id -> new TeamStandingResponse(table.indexOf(id) + 1, table.size(), wins.get(id), losses.get(id))));
    }

    // An admin's record of a season game the league ticket missed. Only in an active season, which keeps the ELO replay
    // to that season's games
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void create(CreateMatchRequest request) {
        Season season = seasonRepository.findById(request.seasonId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Season not found"));
        if (season.getStatus() != SeasonStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Matches can only be added to an active season");
        }
        if (matchRepository.existsById(request.matchId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Match " + request.matchId() + " is already recorded");
        }
        Team radiantTeam = findTeam(season, request.radiantTeamId());
        Team direTeam = findTeam(season, request.direTeamId());
        if (radiantTeam == direTeam) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A team can't play itself");
        }
        Map<String, Player> players = playerRepository.findAllById(Stream.concat(request.radiant().stream(), request.dire().stream()).toList())
                .stream()
                .collect(Collectors.toMap(Player::getSteamId, Function.identity()));
        if (players.size() != 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A match needs 10 different registered players");
        }
        // Not before the season, so K counts the game as this season's, and not in the future
        LocalDateTime played = request.playedTime();
        if (played.isBefore(season.getStartDate().atStartOfDay()) || played.isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The match has to be played between the season's start and now");
        }

        // A game the sync has seen stays tracked by it, even when an admin types it in (from the queue, or back after a delete)
        Optional<LeagueMatch> synced = leagueMatchRepository.findById(request.matchId());
        Match match = new Match();
        match.setMatchId(request.matchId());
        match.setSeason(season);
        match.setRadiantTeam(radiantTeam);
        match.setDireTeam(direTeam);
        match.setPlayedTime(played);
        match.setMatchWinner(request.winner());
        match.setParticipants(new ArrayList<>());
        Map<String, String> subbingFor = request.subbingFor() == null ? Map.of() : request.subbingFor();
        for (Side side : Side.values()) {
            Team team = side == Side.RADIANT ? radiantTeam : direTeam;
            Map<String, Player> members = team.getMembers().stream()
                    .collect(Collectors.toMap(member -> member.getPlayer().getSteamId(), TeamMember::getPlayer));
            for (String steamId : side == Side.RADIANT ? request.radiant() : request.dire()) {
                MatchParticipant participant = new MatchParticipant();
                participant.setMatch(match);
                participant.setPlayer(players.get(steamId));
                participant.setSide(side);
                participant.setSub(!members.containsKey(steamId));
                if (participant.isSub() && subbingFor.containsKey(steamId)) {
                    participant.setSubbingFor(replaced(subbingFor.get(steamId), members, players));
                }
                match.getParticipants().add(participant);
            }
        }
        long recorded = match.getParticipants().stream().filter(participant -> participant.getSubbingFor() != null).count();
        if (recorded != subbingFor.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only a sub in this match can stand in for someone");
        }
        if (new HashSet<>(subbingFor.values()).size() != subbingFor.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Two subs can't stand in for the same player");
        }

        eloService.rewind(played);
        matchRepository.save(match);
        countResult(match, 1);
        eloService.replay(played);
        // Restored, or typed back in by hand: either way it's no longer deleted
        deletedMatchRepository.deleteById(request.matchId());
        // Off the sync's queue, rejected list or deleted list, whichever it was on
        synced.ifPresent(row -> row.setStatus(LeagueMatchStatus.IMPORTED));
    }

    // For a game that was ticketed but shouldn't count. ELO is replayed from it without it
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void delete(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match not found"));
        if (match.getSeason() == null || match.getSeason().getStatus() != SeasonStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only an active season's matches can be deleted");
        }
        LocalDateTime played = match.getPlayedTime();
        deletedMatchRepository.save(binCopy(match));
        // Also drops this match's ELO history, which would otherwise block deleting it
        eloService.rewind(played);
        countResult(match, -1);
        matchRepository.delete(match);
        // On the deleted list, so the next sync doesn't add it back. Add match still can
        leagueMatchRepository.findById(matchId).ifPresent(row -> row.setStatus(LeagueMatchStatus.DELETED));
        eloService.replay(played);
    }

    public List<BinMatchResponse> getBin(UUID seasonId) {
        return deletedMatchRepository.findBySeasonIdOrderByDeletedAtDesc(seasonId)
                .stream()
                .map(copy -> new BinMatchResponse(copy.getMatchId(),
                        copy.getRadiantTeam() != null ? copy.getRadiantTeam().getName() : null,
                        copy.getDireTeam() != null ? copy.getDireTeam().getName() : null,
                        copy.getWinner(), copy.getDeletedAt(), copy.getDeletedAt().plusDays(BIN_DAYS)))
                .toList();
    }

    // Puts a deleted match back as it was, through create, so standings and ELO replay and its checks still apply.
    // If they refuse it, it stays in the bin
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void restore(Long matchId) {
        DeletedMatch copy = deletedMatchRepository.findById(matchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match " + matchId + " isn't in the bin"));
        Map<String, String> subbingFor = copy.getParticipants().stream()
                .filter(participant -> participant.getSubbingFor() != null)
                .collect(Collectors.toMap(DeletedMatch.DeletedParticipant::getSteamId, DeletedMatch.DeletedParticipant::getSubbingFor));
        create(new CreateMatchRequest(matchId, copy.getSeason().getId(), copy.getPlayedTime(), copy.getRadiantTeam().getTeamId(),
                copy.getDireTeam().getTeamId(), copy.getWinner(), binSide(copy, Side.RADIANT), binSide(copy, Side.DIRE), subbingFor));
    }

    @Scheduled(fixedDelayString = "PT1H", initialDelayString = "PT1M")
    @Transactional
    public void purgeBin() {
        deletedMatchRepository.deleteByDeletedAtBefore(LocalDateTime.now().minusDays(BIN_DAYS));
    }

    private static List<String> binSide(DeletedMatch copy, Side side) {
        return copy.getParticipants().stream()
                .filter(participant -> participant.getSide() == side)
                .map(DeletedMatch.DeletedParticipant::getSteamId)
                .toList();
    }

    // What create needs to add the match back
    private static DeletedMatch binCopy(Match match) {
        DeletedMatch copy = new DeletedMatch();
        copy.setMatchId(match.getMatchId());
        copy.setSeason(match.getSeason());
        copy.setPlayedTime(match.getPlayedTime());
        copy.setWinner(match.getMatchWinner());
        copy.setRadiantTeam(match.getRadiantTeam());
        copy.setDireTeam(match.getDireTeam());
        copy.setDeletedAt(LocalDateTime.now());
        copy.setParticipants(new ArrayList<>(match.getParticipants().stream().map(participant -> {
            DeletedMatch.DeletedParticipant copied = new DeletedMatch.DeletedParticipant();
            copied.setSteamId(participant.getPlayer().getSteamId());
            copied.setSide(participant.getSide());
            copied.setSubbingFor(participant.getSubbingFor() != null ? participant.getSubbingFor().getSteamId() : null);
            return copied;
        }).toList()));
        return copy;
    }

    // The team member a sub stood in for: on the sub's own team, and not playing in the match themselves
    private static Player replaced(String steamId, Map<String, Player> members, Map<String, Player> playing) {
        if (!members.containsKey(steamId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A sub can only stand in for someone on their side's team");
        }
        if (playing.containsKey(steamId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A sub can't stand in for someone who played");
        }
        return members.get(steamId);
    }

    private static Team findTeam(Season season, UUID teamId) {
        return season.getTeams().stream()
                .filter(team -> team.getTeamId().equals(teamId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Both teams have to be in this season"));
    }

    // The standings' W/L are stored (seeded from the sheet), not counted from matches, so they follow a match in and out
    private static void countResult(Match match, int by) {
        Team winner = winner(match);
        Team loser = loser(match);
        if (winner != null) winner.setWins(winner.getWins() + by);
        if (loser != null) loser.setLosses(loser.getLosses() + by);
    }

    // null for an in-house, which has no teams
    private static Team winner(Match match) {
        return match.getMatchWinner() == Side.RADIANT ? match.getRadiantTeam() : match.getDireTeam();
    }

    private static Team loser(Match match) {
        return match.getMatchWinner() == Side.RADIANT ? match.getDireTeam() : match.getRadiantTeam();
    }

    private MatchSummaryResponse mapToSummaryResponse(Match match) {
        return new MatchSummaryResponse(
                match.getMatchId(),
                match.getMatchWinner(),
                match.getPlayedTime(),
                match.getAvgElo(),
                match.getSeason() != null ? match.getSeason().getId() : null,
                match.getSeason() != null ? match.getSeason()
                        .getName() : null,
                match.getRadiantTeam() != null ? match.getRadiantTeam()
                        .getName() : null,
                match.getDireTeam() != null ? match.getDireTeam()
                        .getName() : null);
    }
}
