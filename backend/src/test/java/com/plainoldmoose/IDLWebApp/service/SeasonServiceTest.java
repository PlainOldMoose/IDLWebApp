package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
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
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SeasonServiceTest {

    private final UUID seasonId = UUID.randomUUID();
    private final Season season = new Season();
    private final MatchRepository matchRepository = mock(MatchRepository.class);
    private final EloHistoryRepository eloHistoryRepository = mock(EloHistoryRepository.class);
    private final DeletedMatchRepository bin = mock(DeletedMatchRepository.class);
    private final SeasonRepository seasonRepository = mock(SeasonRepository.class, inv -> Optional.of(season));
    private final SeasonService service = new SeasonService(seasonRepository, matchRepository, eloHistoryRepository, bin);

    @Test
    void completeSeason() {
        Team champions = new Team();
        champions.setTeamId(UUID.randomUUID());
        season.setTeams(List.of(champions));
        season.setStatus(SeasonStatus.ACTIVE);

        assertThrows(ResponseStatusException.class, () -> service.completeSeason(seasonId, UUID.randomUUID()));
        assertEquals(SeasonStatus.ACTIVE, season.getStatus());

        service.completeSeason(seasonId, champions.getTeamId());
        assertSame(champions, season.getWinner());
        assertEquals(SeasonStatus.COMPLETED, season.getStatus());

        assertThrows(ResponseStatusException.class, () -> service.completeSeason(seasonId, champions.getTeamId()));
    }

    @Test
    void setsAndShowsTheLeagueTicket() {
        season.setTeams(List.of());

        service.setLeague(seasonId, 15728L);

        assertEquals(15728L, season.getLeagueId());
        assertEquals(15728L, service.getSeasonById(seasonId).leagueId());

        service.setLeague(seasonId, null);
        assertNull(season.getLeagueId());
    }

    // Behaviour 55: restoring needs an active season, so its bin goes when it ends
    @Test
    void endingASeasonEmptiesItsBin() {
        Team champions = new Team();
        champions.setTeamId(UUID.randomUUID());
        season.setId(seasonId);
        season.setTeams(List.of(champions));
        season.setStatus(SeasonStatus.ACTIVE);

        service.completeSeason(seasonId, champions.getTeamId());

        verify(bin).deleteBySeasonId(seasonId);
    }

    private static Team team(String name, int wins, int losses) {
        Player captain = new Player();
        captain.setUsername(name + " captain");
        Team team = new Team();
        team.setTeamId(UUID.randomUUID());
        team.setName(name);
        team.setCaptain(captain);
        team.setWins(wins);
        team.setLosses(losses);
        return team;
    }

    @Test
    void detailListsTeamsInTableOrder() {
        // Most wins first, then fewest losses
        season.setTeams(List.of(team("Bottom", 1, 3), team("Top", 3, 0), team("Second", 2, 1), team("Third", 2, 2)));

        assertEquals(List.of("Top", "Second", "Third", "Bottom"),
                service.getSeasonById(seasonId).teams().stream().map(TeamResponse::name).toList());
    }

    private static EloHistory eloHistory(double elo, double change) {
        EloHistory row = new EloHistory();
        row.setElo(elo);
        row.setEloChange(change);
        return row;
    }

    @Test
    void finishedSeasonShowsEloAsOfItsLastGame() {
        LocalDateTime lastGame = LocalDateTime.of(2026, 9, 1, 20, 0);
        Match last = new Match();
        last.setPlayedTime(lastGame);
        season.setId(seasonId);
        when(matchRepository.findBySeasonIdOrderByPlayedTimeDesc(seasonId)).thenReturn(List.of(last));

        // Played up to the end, only played after it, and never played
        Player played = new Player(), joinedLater = new Player(), idle = new Player();
        played.setSteamId("played");
        played.setElo(1300);
        joinedLater.setSteamId("later");
        joinedLater.setElo(1250);
        idle.setSteamId("idle");
        idle.setElo(1000);
        when(eloHistoryRepository.findFirstByPlayerSteamIdAndTimestampLessThanEqualOrderByTimestampDescIdDesc("played", lastGame))
                .thenReturn(Optional.of(eloHistory(1100, 20)));
        when(eloHistoryRepository.findFirstByPlayerSteamIdAndTimestampAfterOrderByTimestampAscIdAsc("later", lastGame))
                .thenReturn(Optional.of(eloHistory(1215, 15)));

        Team team = team("Team", 3, 1);
        team.setMembers(List.of(played, joinedLater, idle).stream().map(player -> {
            TeamMember member = new TeamMember();
            member.setPlayer(player);
            return member;
        }).toList());
        season.setTeams(List.of(team));

        season.setStatus(SeasonStatus.ACTIVE);
        assertEquals(List.of(1300.0, 1250.0, 1000.0), memberElos());

        season.setStatus(SeasonStatus.COMPLETED);
        assertEquals(List.of(1100.0, 1200.0, 1000.0), memberElos());
    }

    private List<Double> memberElos() {
        return service.getSeasonById(seasonId).teams().get(0).members().stream().map(PlayerSummaryResponse::elo).toList();
    }

    // Behaviours 1-3: the season list carries each winner for the hall of fame, captain first
    @Test
    void seasonListShowsTheWinner() {
        doReturn(List.of(season)).when(seasonRepository).findAllByOrderByStartDateDesc();

        SeasonSummaryResponse summary = service.getAllSeasons().get(0);
        assertNull(summary.winnerTeamName());
        assertEquals(List.of(), summary.winnerPlayers());

        Team champions = team("Commando Elite", 5, 0);
        Player gron = new Player();
        gron.setUsername("Gron");
        champions.setMembers(List.of(gron, champions.getCaptain()).stream().map(player -> {
            TeamMember member = new TeamMember();
            member.setPlayer(player);
            return member;
        }).toList());
        season.setWinner(champions);

        summary = service.getAllSeasons().get(0);
        assertEquals("Commando Elite", summary.winnerTeamName());
        assertEquals(List.of("Commando Elite captain", "Gron"), summary.winnerPlayers());
    }

    @Test
    void seasonListShowsAnImportedWinner() {
        doReturn(List.of(season)).when(seasonRepository).findAllByOrderByStartDateDesc();
        season.setLegacyWinnerName("Antab's team");
        season.setLegacyWinnerPlayers(List.of("Antab", "Snubs"));

        SeasonSummaryResponse summary = service.getAllSeasons().get(0);
        assertEquals("Antab's team", summary.winnerTeamName());
        assertEquals(List.of("Antab", "Snubs"), summary.winnerPlayers());
    }
}
