package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.match.MatchSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.Match;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class MatchService {
    private final MatchRepository matchRepository;

    public List<MatchSummaryResponse> getAllMatches() {
        return matchRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private MatchSummaryResponse mapToResponse(Match match) {
        return new MatchSummaryResponse(match.getMatchId(), match.getMatchWinner(), match.getPlayedTime(), match.getAvgElo());
    }
}
