package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.match.MatchDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.MatchPlayerResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.MatchSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.player.EloHistory;
import com.plainoldmoose.IDLWebApp.repository.EloHistoryRepository;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class MatchService {
    private final MatchRepository matchRepository;
    private final EloHistoryRepository eloHistoryRepository;

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
                            mp.getIsSub() != null && mp.getIsSub(),
                            mp.getSubbingFor() != null ? mp.getSubbingFor().getUsername() : null,
                            // History stores the ELO after the match
                            elo != null ? elo.getElo() - elo.getEloChange() : null,
                            elo != null ? elo.getEloChange() : null);
                })
                .sorted(Comparator.comparing(MatchPlayerResponse::eloBefore, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        return new MatchDetailResponse(mapToSummaryResponse(match), players);
    }

    private MatchSummaryResponse mapToSummaryResponse(Match match) {
        return new MatchSummaryResponse(
                match.getMatchId(),
                match.getMatchWinner(),
                match.getPlayedTime(),
                match.getAvgElo(),
                match.getSeason() != null ? match.getSeason()
                        .getName() : null,
                match.getRadiantTeam() != null ? match.getRadiantTeam()
                        .getName() : null,
                match.getDireTeam() != null ? match.getDireTeam()
                        .getName() : null);
    }
}
