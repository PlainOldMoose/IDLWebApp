package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.client.OpenDotaClient;
import com.plainoldmoose.IDLWebApp.client.OpenDotaClient.GameDetails;
import com.plainoldmoose.IDLWebApp.client.OpenDotaClient.GamePlayer;
import com.plainoldmoose.IDLWebApp.client.SteamClient;
import com.plainoldmoose.IDLWebApp.client.SteamClient.LeagueGame;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.TeamMember;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import com.plainoldmoose.IDLWebApp.repository.TeamRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// The timer runs outside any request, so unlike "Sync now" there's no open session to load a season's teams lazily.
// Needs a real database to show it: the mocked tests hand over seasons with their teams already there
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:timersync;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class MatchSyncServiceTimerTest {

    private static final long LEAGUE = 15728L;

    @MockitoBean
    private SteamClient steam;
    @MockitoBean
    private OpenDotaClient openDota;
    @MockitoBean
    private MatchService matchService;

    @Autowired
    private MatchSyncService service;
    @Autowired
    private SeasonRepository seasons;
    @Autowired
    private TeamRepository teams;
    @Autowired
    private PlayerRepository players;

    @Test
    void timerImportsAGameBetweenTwoSeasonTeams() {
        List<Player> everyone = players.saveAll(IntStream.range(0, 10).mapToObj(i -> {
            Player player = new Player();
            player.setSteamId(String.valueOf(i));
            player.setUsername("p" + i);
            return player;
        }).toList());
        Season season = new Season();
        season.setName("Season");
        season.setStatus(SeasonStatus.ACTIVE);
        season.setStartDate(LocalDate.now().minusWeeks(2));
        season.setLeagueId(LEAGUE);
        seasons.save(season);
        team(season, "A", everyone.subList(0, 5));
        team(season, "B", everyone.subList(5, 10));

        long played = LocalDateTime.now().minusHours(2).toEpochSecond(ZoneOffset.UTC);
        List<GamePlayer> gamePlayers = Stream.concat(
                IntStream.range(0, 5).mapToObj(i -> new GamePlayer(String.valueOf(i), true)),
                IntStream.range(5, 10).mapToObj(i -> new GamePlayer(String.valueOf(i), false))).toList();
        when(steam.leagueMatches(LEAGUE)).thenReturn(List.of(new LeagueGame(1L, played, gamePlayers)));
        when(openDota.match(1L)).thenReturn(Optional.of(new GameDetails(played, true, gamePlayers, 40 * 60, 45, 3000, 0)));

        service.syncAll();

        verify(matchService).create(any());
    }

    private void team(Season season, String name, List<Player> roster) {
        Team team = new Team();
        team.setName(name);
        team.setSeason(season);
        team.setCaptain(roster.get(0));
        roster.forEach(player -> {
            TeamMember member = new TeamMember();
            member.setTeam(team);
            member.setPlayer(player);
            team.getMembers().add(member);
        });
        teams.save(team);
    }
}
