package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreateSeasonRequest;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.team.TeamResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class SeasonService {

    private SeasonRepository seasonRepository;

    public SeasonSummaryResponse createSeason(CreateSeasonRequest request) {
        Season season = new Season();
        season.setName(request.name());
        season.setStartDate(request.startDate());
        season.setEndDate(request.endDate());

        Season saved = seasonRepository.save(season);

        return mapToSummaryResponse(saved);
    }

    public List<SeasonSummaryResponse> getAllSeasons() {
        return seasonRepository.findAllByOrderByStartDateDesc()
                .stream()
                .map(this::mapToSummaryResponse)
                .toList();
    }

    public SeasonDetailResponse getSeasonById(UUID id) {
        return seasonRepository.findById(id)
                .map(this::mapToDetailResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Season not found"));
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
                season.getTeams()
                        .stream()
                        .map(this::mapToTeamResponse)
                        .toList(),
                season.getWinner() != null ? season.getWinner()
                        .getName() : null);
    }

    private TeamResponse mapToTeamResponse(Team team) {
        List<PlayerSummaryResponse> members = team.getMembers()
                .stream()
                .map(member -> {
                    Player player = member.getPlayer();
                    return new PlayerSummaryResponse(player.getUsername(), player.getElo(), player.getSteamId());
                })
                .toList();

        return new TeamResponse(
                team.getTeamId(),
                team.getName(),
                team.getCaptain()
                        .getUsername(),
                members,
                team.getAvgElo(),
                team.getWins(),
                team.getLosses()
        );
    }
}
