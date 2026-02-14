package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreateScheduledMatchRequest;
import com.plainoldmoose.IDLWebApp.dto.response.match.ScheduledMatchSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.match.ScheduledMatch;
import com.plainoldmoose.IDLWebApp.repository.ScheduledMatchRepository;
import com.plainoldmoose.IDLWebApp.repository.TeamRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class ScheduledMatchService {
    private final ScheduledMatchRepository scheduledMatchRepository;
    private final TeamRepository teamRepository;

    public ScheduledMatchSummaryResponse createScheduledMatch(CreateScheduledMatchRequest request) {
        Team teamA = teamRepository.findById(request.teamAId())
                .orElseThrow(() -> new EntityNotFoundException("Team not found > " + request.teamAId()));
        Team teamB = teamRepository.findById(request.teamBId())
                .orElseThrow(() -> new EntityNotFoundException("Team not found > " + request.teamBId()));

        ScheduledMatch scheduledMatch = new ScheduledMatch();
        scheduledMatch.setTeamA(teamA);
        scheduledMatch.setTeamB(teamB);
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
