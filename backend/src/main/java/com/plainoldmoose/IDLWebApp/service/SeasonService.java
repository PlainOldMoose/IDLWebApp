package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreateSeasonRequest;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.team.TeamResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.player.Player;
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Season not found"));
    }

    // Only seasons nothing has been played in: teams and matches carry elo history we don't want to lose
    @Transactional
    public void deleteSeason(UUID id) {
        Season season = seasonRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Season not found"));

        if (!season.getTeams().isEmpty() || matchRepository.existsBySeasonId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seasons with teams or matches can't be deleted");
        }

        seasonRepository.delete(season);
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
