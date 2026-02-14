package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreateSeasonRequest;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.team.TeamMemberResponse;
import com.plainoldmoose.IDLWebApp.dto.response.team.TeamSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.TeamMember;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class SeasonService {

    private SeasonRepository seasonRepository;

    public SeasonSummaryResponse createSeason(@Valid CreateSeasonRequest request) {
        Season season = new Season();
        season.setName(request.name());
        season.setStartDate(request.startDate());
        season.setEndDate(request.endDate());

        Season saved = seasonRepository.save(season);

        return mapToSummaryResponse(saved);
    }

    public List<SeasonSummaryResponse> getAllSeasons() {
        return seasonRepository.findAll()
                .stream()
                .map(this::mapToSummaryResponse)
                .toList();
    }

    public SeasonDetailResponse getSeasonById(UUID id) {
        Optional<Season> season = seasonRepository.findById(id);

        return season.map(this::mapToDetailResponse)
                .orElse(null);
    }

    private SeasonSummaryResponse mapToSummaryResponse(Season season) {
        return new SeasonSummaryResponse(season.getName(), season.getStatus(), season.getId(), season.getStartDate(), season.getEndDate());
    }

    private SeasonDetailResponse mapToDetailResponse(Season season) {
        return new SeasonDetailResponse(
                season.getName(),
                season.getId(),
                season.getStatus(),
                season.getStartDate(),
                season.getEndDate(),
                mapToTeamSummaryResponse(season.getTeams()),
                season.getWinner() != null ? season.getWinner()
                        .getName() : null);
    }

    private List<TeamSummaryResponse> mapToTeamSummaryResponse(List<Team> teams) {
        ArrayList<TeamSummaryResponse> teamsResponse = new ArrayList<>();

        for (Team t : teams) {
            List<TeamMemberResponse> members = t.getMembers()
                    .stream()
                    .map(this::mapToMemberResponse)
                    .toList();

            TeamSummaryResponse response = new TeamSummaryResponse(
                    t.getName(),
                    t.getCaptain()
                            .getUsername(),
                    members
            );
            teamsResponse.add(response);
        }
        return teamsResponse;
    }

    private TeamMemberResponse mapToMemberResponse(TeamMember member) {
        return new TeamMemberResponse(
                member.getPlayer()
                        .getSteamId(),
                member.getPlayer()
                        .getUsername(),
                member.getPlayer()
                        .getElo()
        );
    }
}
