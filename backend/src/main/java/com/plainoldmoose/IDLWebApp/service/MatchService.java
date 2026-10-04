package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreateMatchRequest;
import com.plainoldmoose.IDLWebApp.dto.response.match.MatchDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.MatchPlayerResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.MatchSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.match.MatchParticipant;
import com.plainoldmoose.IDLWebApp.model.player.EloHistory;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.EloHistoryRepository;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@AllArgsConstructor
public class MatchService {
    private final MatchRepository matchRepository;
    private final EloHistoryRepository eloHistoryRepository;
    private final SeasonRepository seasonRepository;
    private final PlayerRepository playerRepository;
    private final EloService eloService;

    public List<MatchSummaryResponse> getAllMatches(UUID seasonId) {
        List<Match> matches = seasonId != null
                ? matchRepository.findBySeasonIdOrderByPlayedTimeDesc(seasonId)
                : matchRepository.findAllByOrderByPlayedTimeDesc();

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

        return new MatchDetailResponse(mapToSummaryResponse(match), players);
    }

    // An admin's record of a season game the league ticket missed. Only in an active season, which keeps the ELO replay
    // to that season's games. SecurityConfig keeps this admin-only
    @Transactional
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

        Match match = new Match();
        match.setMatchId(request.matchId());
        match.setSeason(season);
        match.setRadiantTeam(radiantTeam);
        match.setDireTeam(direTeam);
        match.setPlayedTime(played);
        match.setMatchWinner(request.winner());
        match.setParticipants(new ArrayList<>());
        for (Side side : Side.values()) {
            Team team = side == Side.RADIANT ? radiantTeam : direTeam;
            for (String steamId : side == Side.RADIANT ? request.radiant() : request.dire()) {
                MatchParticipant participant = new MatchParticipant();
                participant.setMatch(match);
                participant.setPlayer(players.get(steamId));
                participant.setSide(side);
                participant.setSub(team.getMembers().stream().noneMatch(member -> member.getPlayer().getSteamId().equals(steamId)));
                match.getParticipants().add(participant);
            }
        }

        eloService.rewind(played);
        matchRepository.save(match);
        countResult(match, 1);
        eloService.replay(played);
    }

    // For a game that was ticketed but shouldn't count. ELO is replayed from it without it. SecurityConfig keeps this admin-only
    @Transactional
    public void delete(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match not found"));
        if (match.getSeason() == null || match.getSeason().getStatus() != SeasonStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only an active season's matches can be deleted");
        }
        LocalDateTime played = match.getPlayedTime();
        // Also drops this match's ELO history, which would otherwise block deleting it
        eloService.rewind(played);
        countResult(match, -1);
        matchRepository.delete(match);
        eloService.replay(played);
    }

    private static Team findTeam(Season season, UUID teamId) {
        return season.getTeams().stream()
                .filter(team -> team.getTeamId().equals(teamId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Both teams have to be in this season"));
    }

    // The standings' W/L are stored (seeded from the sheet), not counted from matches, so they follow a match in and out
    private static void countResult(Match match, int by) {
        boolean radiantWon = match.getMatchWinner() == Side.RADIANT;
        Team winner = radiantWon ? match.getRadiantTeam() : match.getDireTeam();
        Team loser = radiantWon ? match.getDireTeam() : match.getRadiantTeam();
        if (winner != null) winner.setWins(winner.getWins() + by);
        if (loser != null) loser.setLosses(loser.getLosses() + by);
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
