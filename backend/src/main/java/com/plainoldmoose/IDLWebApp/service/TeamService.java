package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.team.TeamMemberResponse;
import com.plainoldmoose.IDLWebApp.dto.response.team.TeamResponse;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.repository.TeamMemberRepository;
import com.plainoldmoose.IDLWebApp.repository.TeamRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class TeamService {
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;

    public List<TeamResponse> getAllTeamsBySeason(UUID seasonId) {
        return teamRepository.findBySeasonId(seasonId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private TeamResponse mapToResponse(Team team) {
        List<TeamMemberResponse> members = team.getMembers()
                .stream()
                .map(tm -> new TeamMemberResponse(
                        tm.getPlayer()
                                .getSteamId(),
                        tm.getPlayer()
                                .getUsername(),
                        tm.getPlayer()
                                .getElo()))
                .toList();

        int totalMatches = team.getWins() + team.getLosses();
        double winRate = totalMatches > 0 ? (team.getWins() * 100.0) / totalMatches : 0.0;

        return new TeamResponse(
                team.getTeamId(),
                team.getName(),
                team.getCaptain()
                        .getSteamId(),
                team.getCaptain()
                        .getUsername(),
                members,
                team.getAvgElo(),
                team.getWins(),
                team.getLosses(),
                winRate
        );
    }
}
