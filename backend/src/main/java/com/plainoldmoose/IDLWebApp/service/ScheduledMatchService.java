package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreateScheduledMatchRequest;
import com.plainoldmoose.IDLWebApp.dto.response.match.ScheduledMatchSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.match.ScheduledMatch;
import com.plainoldmoose.IDLWebApp.repository.ScheduledMatchRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class ScheduledMatchService {
    private final ScheduledMatchRepository scheduledMatchRepository;

    public ScheduledMatchSummaryResponse createScheduledMatch(CreateScheduledMatchRequest request) {
        ScheduledMatch scheduledMatch = new ScheduledMatch();
        scheduledMatch.setTeamA(request.teamA());
        scheduledMatch.setTeamB(request.teamB());
        scheduledMatch.setScheduledTime(request.scheduledTime());

        ScheduledMatch saved = scheduledMatchRepository.save(scheduledMatch);
        return mapToSummaryResponse(saved);
    }

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
