package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.ScheduledMatchSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.match.ScheduledMatch;
import com.plainoldmoose.IDLWebApp.repository.ScheduledMatchRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class ScheduledMatchService {
    private final ScheduledMatchRepository scheduledMatchRepository;

    public List<ScheduledMatchSummaryResponse> getAllScheduledMatches() {
        return scheduledMatchRepository.findAll()
                .stream()
                .map(this::mapToSummaryResponse)
                .toList();
    }

    private ScheduledMatchSummaryResponse mapToSummaryResponse(ScheduledMatch scheduledMatch) {
        return new ScheduledMatchSummaryResponse(scheduledMatch.getId(), scheduledMatch.getTeamA()
                .getName(), scheduledMatch.getTeamB()
                .getName(), scheduledMatch.getScheduledTime());
    }
}
