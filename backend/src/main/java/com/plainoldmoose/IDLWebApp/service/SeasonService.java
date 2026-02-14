package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreateSeasonRequest;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.team.TeamMemberResponse;
import com.plainoldmoose.IDLWebApp.dto.response.team.TeamResponse;
import com.plainoldmoose.IDLWebApp.dto.response.team.TeamSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.TeamMember;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

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

    @GetMapping("/{id}")
    public SeasonDetailResponse getSeasonById(@PathVariable UUID id) {
        Optional<Season> season = seasonRepository.findById(id);

        return season.map(this::mapToDetailResponse)
                .orElse(null);
    }

//    public SeasonDetailResponse getActiveSeason() {
//        Optional<Season> activeSeason = seasonRepository.findByStatus(SeasonStatus.ACTIVE);
//        return activeSeason.map(this::mapToDetailResponseSortedByWins)
//                .orElse(null);
//    }

//    private SeasonDetailResponse mapToDetailResponseSortedByWins(Season season) {
//        List<TeamResponse> teams = mapToTeamResponse(season.getTeams());
//        List<TeamResponse> sortedTeams = teams.stream()
//                .sorted(Comparator.comparingInt(TeamSummaryResponse::wins)
//                        .reversed()
//                        .thenComparing(Comparator.comparingDouble(TeamSummaryResponse::winRate)
//                                .reversed()))
//                .toList();
//
//        return new SeasonDetailResponse(
//                season.getName(),
//                season.getId(),
//                season.getStatus(),
//                season.getStartDate(),
//                season.getEndDate(),
//                sortedTeams,
//                season.getWinner() != null ? season.getWinner()
//                        .getName() : null
//        );
//    }

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

    private SeasonSummaryResponse mapToSummaryResponse(Season season) {
        return new SeasonSummaryResponse(season.getName(), season.getStatus(), season.getId(), season.getStartDate(), season.getEndDate());
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

    private List<TeamResponse> mapToTeamResponse(List<Team> teams) {
        ArrayList<TeamResponse> teamsResponse = new ArrayList<>();

        for (Team t : teams) {
            List<TeamMemberResponse> members = t.getMembers()
                    .stream()
                    .map(this::mapToMemberResponse)
                    .toList();

            int totalGames = t.getWins() + t.getLosses();
            double winRate = totalGames > 0 ? (double) t.getWins() / totalGames * 100 : 0.0;

            TeamResponse response = new TeamResponse(
                    t.getTeamId(),
                    t.getName(),
                    t.getCaptain()
                            .getSteamId(),
                    t.getCaptain()
                            .getUsername(),
                    members,
                    t.getAvgElo(),
                    t.getWins(),
                    t.getLosses(),
                    winRate
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
