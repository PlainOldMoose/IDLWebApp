package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreateSeasonRequest;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.team.TeamResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class SeasonService {

    private static final String SEASON_NOT_FOUND = "Season not found";

    private SeasonRepository seasonRepository;
    private MatchRepository matchRepository;

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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, SEASON_NOT_FOUND));
    }

    // Only seasons nothing has been played in: matches carry ELO history and teams their standings
    @Transactional
    public void deleteSeason(UUID id) {
        Season season = seasonRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, SEASON_NOT_FOUND));

        if (!season.getTeams().isEmpty() || matchRepository.existsBySeasonId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seasons with teams or matches can't be deleted");
        }

        seasonRepository.delete(season);
    }

    // The admin picks the winner: there's no bracket to work it out from. One-way, since matches only go into an active
    // season and the winner is fixed once set
    @Transactional
    public void completeSeason(UUID id, UUID winnerTeamId) {
        Season season = seasonRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, SEASON_NOT_FOUND));
        if (season.getStatus() != SeasonStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only an active season can be ended");
        }
        Team winner = season.getTeams().stream()
                .filter(team -> team.getTeamId().equals(winnerTeamId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "The winner has to be a team in this season"));

        season.setWinner(winner);
        season.setStatus(SeasonStatus.COMPLETED);
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
                .map(member -> PlayerSummaryResponse.from(member.getPlayer()))
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
