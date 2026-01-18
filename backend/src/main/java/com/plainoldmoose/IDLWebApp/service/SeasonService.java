package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.team.TeamResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class SeasonService {

    private SeasonRepository seasonRepository;

    public List<SeasonDetailResponse> getAllSeasons() {
        return seasonRepository.findAll()
                .stream()
                .map(this::mapToDetailResponse)
                .toList();
    }

    public SeasonDetailResponse getSeasonById(@PathVariable UUID id) {
        Optional<Season> season = seasonRepository.findById(id);

        if (season.isPresent()) {
            return mapToDetailResponse(season.get());
        }

        return null;
    }

    public void insertSeason(Season season) {
        seasonRepository.save(season);
    }

    private SeasonDetailResponse mapToDetailResponse(Season season) {
        return new SeasonDetailResponse(season.getName(), season.getStatus(), season.getStartDate(), season.getEndDate(), mapToTeamResponse(season.getTeams()));
    }

    private List<TeamResponse> mapToTeamResponse(List<Team> teams) {
        ArrayList<TeamResponse> teamsResponse = new ArrayList<>();
        for (Team t : teams) {
            TeamResponse response = new TeamResponse(t.getName());
            teamsResponse.add(response);
        }
        return teamsResponse;
    }
}
