package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.match.MatchSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class MatchService {
    private final MatchRepository matchRepository;

    public List<MatchSummaryResponse> getAllMatches(UUID seasonId) {
        List<Match> matches = seasonId != null
                ? matchRepository.findBySeasonIdOrderByPlayedTimeDesc(seasonId)
                : matchRepository.findAllByOrderByPlayedTimeDesc();

        return matches.stream()
                .map(this::mapToSummaryResponse)
                .toList();
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
