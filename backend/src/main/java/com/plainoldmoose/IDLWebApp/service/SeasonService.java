package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreateSeasonRequest;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.team.TeamResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.TeamMember;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.player.EloHistory;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.DeletedMatchRepository;
import com.plainoldmoose.IDLWebApp.repository.EloHistoryRepository;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class SeasonService {

    private static final String SEASON_NOT_FOUND = "Season not found";

    private SeasonRepository seasonRepository;
    private MatchRepository matchRepository;
    private EloHistoryRepository eloHistoryRepository;
    private DeletedMatchRepository deletedMatchRepository;

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
        // Restoring needs an active season, so its bin can't be used any more
        deletedMatchRepository.deleteBySeasonId(id);
    }

    private SeasonSummaryResponse mapToSummaryResponse(Season season) {
        return new SeasonSummaryResponse(season.getName(), season.getStatus(), season.getId(), season.getStartDate(),
                season.getEndDate(), winnerName(season), winnerPlayers(season));
    }

    // The winner team, else one imported from before the app
    private String winnerName(Season season) {
        return season.getWinner() != null ? season.getWinner().getName() : season.getLegacyWinnerName();
    }

    // Usernames, captain first
    private List<String> winnerPlayers(Season season) {
        Team winner = season.getWinner();
        if (winner == null) {
            return season.getLegacyWinnerPlayers();
        }
        return winner.getMembers()
                .stream()
                .map(TeamMember::getPlayer)
                .sorted(Comparator.comparing((Player player) -> player != winner.getCaptain()))
                .map(Player::getUsername)
                .toList();
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
                        .sorted(Team.tableOrder(Team::getWins, Team::getLosses))
                        .map(team -> mapToTeamResponse(team, seasonEnd(season)))
                        .toList(),
                winnerName(season),
                season.getLeagueId());
    }

    @Transactional
    public void setLeague(UUID id, Long leagueId) {
        seasonRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, SEASON_NOT_FOUND))
                .setLeagueId(leagueId);
    }

    // A finished season's last game, or null while it's still going (or never had one) and current ELO is the right one
    private LocalDateTime seasonEnd(Season season) {
        if (season.getStatus() != SeasonStatus.COMPLETED) {
            return null;
        }
        return matchRepository.findBySeasonIdOrderByPlayedTimeDesc(season.getId())
                .stream()
                .findFirst()
                .map(Match::getPlayedTime)
                .orElse(null);
    }

    // Their ELO once the season's last game was played: the last change by then, or else what they had going into
    // their next game. Neither means it never moved, so it's still their current ELO
    private double eloAt(Player player, LocalDateTime end) {
        if (end == null) {
            return player.getElo();
        }
        String steamId = player.getSteamId();
        return eloHistoryRepository.findFirstByPlayerSteamIdAndTimestampLessThanEqualOrderByTimestampDescIdDesc(steamId, end)
                .map(EloHistory::getElo)
                .or(() -> eloHistoryRepository.findFirstByPlayerSteamIdAndTimestampAfterOrderByTimestampAscIdAsc(steamId, end)
                        .map(next -> next.getElo() - next.getEloChange()))
                .orElse(player.getElo());
    }

    private TeamResponse mapToTeamResponse(Team team, LocalDateTime end) {
        List<PlayerSummaryResponse> members = team.getMembers()
                .stream()
                .map(TeamMember::getPlayer)
                .map(player -> new PlayerSummaryResponse(player.getUsername(), eloAt(player, end), player.getSteamId(), player.isDisabled()))
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
